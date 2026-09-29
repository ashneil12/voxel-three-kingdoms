"""Read-only, standard-library GLB inventory. Not a topology or animation QA test."""
import argparse
import hashlib
import json
import struct
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('file', type=Path)
args = parser.parse_args()
data = args.file.read_bytes()
magic, version, declared_size = struct.unpack_from('<4sII', data)
if magic != b'glTF' or version != 2 or declared_size != len(data):
    raise SystemExit('Invalid GLB 2 header or length')
offset = 12
document = None
binary = b''
while offset < len(data):
    length, kind = struct.unpack_from('<I4s', data, offset)
    chunk = data[offset + 8:offset + 8 + length]
    if len(chunk) != length:
        raise SystemExit('Truncated GLB chunk')
    if kind == b'JSON':
        document = json.loads(chunk)
    elif kind == b'BIN\x00':
        binary = chunk
    offset += 8 + length
if document is None:
    raise SystemExit('Missing JSON chunk')
accessors = document.get('accessors', [])
triangles = 0
attributes = set()
for mesh in document.get('meshes', []):
    for primitive in mesh.get('primitives', []):
        attributes.update(primitive['attributes'])
        count = accessors[primitive.get('indices', primitive['attributes']['POSITION'])]['count']
        mode = primitive.get('mode', 4)
        if mode == 4:
            triangles += count // 3
        elif mode in (5, 6):
            triangles += max(0, count - 2)
images = []
for image in document.get('images', []):
    details = {'mimeType': image.get('mimeType'), 'uri': image.get('uri')}
    if 'bufferView' in image:
        view = document['bufferViews'][image['bufferView']]
        start = view.get('byteOffset', 0)
        blob = binary[start:start + view['byteLength']]
        details['bytes'] = len(blob)
        if blob[:8] == b'\x89PNG\r\n\x1a\n':
            details['size'] = struct.unpack_from('>II', blob, 16)
    images.append(details)
print(json.dumps({
    'file': str(args.file), 'bytes': len(data),
    'sha256': hashlib.sha256(data).hexdigest(), 'triangles': triangles,
    'meshes': len(document.get('meshes', [])), 'nodes': len(document.get('nodes', [])),
    'skins': len(document.get('skins', [])),
    'jointReferences': sum(len(s.get('joints', [])) for s in document.get('skins', [])),
    'animations': len(document.get('animations', [])), 'attributes': sorted(attributes),
    'materials': len(document.get('materials', [])), 'images': images,
    'note': 'Static inventory only. Does not establish clean topology, riggability, performance or visual fidelity.'
}, indent=2))
