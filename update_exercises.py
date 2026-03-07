import re
import sys

with open('e:/Exercise_training_model/src/main.js', 'r', encoding='utf-8') as f:
    text = f.read()

start_idx = text.find('const EXERCISE_LIBRARY = {')
end_idx = text.find('};\n\nclass App {')

if start_idx == -1 or end_idx == -1:
    print('Error finding block delimiters.')
    sys.exit(1)

lib_text = text[start_idx:end_idx]

# Find all info block starts
info_starts = [m.start() for m in re.finditer(r"info:\s*['\"]", lib_text)]

if not info_starts:
    print('No info properties found.')
    sys.exit(1)

info_starts.append(len(lib_text))

new_lib_text = lib_text[:info_starts[0]]

for i in range(len(info_starts) - 1):
    curr = info_starts[0] if i == 0 else info_starts[i] # Actually wait, loop logic
    curr = info_starts[i]
    nxt = info_starts[i+1]
    
    block = lib_text[curr:nxt]
    
    # Extract step names
    names = re.findall(r"name:\s*['\"]([^'\"]+)['\"]", block)
    steps_text = '\\n'.join(f'{idx+1}. {name}' for idx, name in enumerate(names))
    
    # Double durations
    def double_dur(m):
        val = float(m.group(1))
        new_val = val * 2
        new_val_str = str(int(new_val)) if new_val.is_integer() else str(new_val)
        return f'duration: {new_val_str}'
        
    block = re.sub(r'duration:\s*([\d\.]+)', double_dur, block)
    
    # Replace the info value with steps_text
    # We match `info: '` or `info: "` followed by non-quote chars until `',` or `",`
    # We replace whatever is between the quotes with steps_text.
    
    def replace_info(m):
        prefix = m.group(1)
        suffix = m.group(2)
        return prefix + steps_text + suffix

    block = re.sub(r"(info:\s*['\"]).*?(['\"]\s*,)", replace_info, block, count=1, flags=re.DOTALL)
    new_lib_text += block

new_text = text[:start_idx] + new_lib_text + text[end_idx:]

with open('e:/Exercise_training_model/src/main.js', 'w', encoding='utf-8') as f:
    f.write(new_text)

print('Updated successfully!')
