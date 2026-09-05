import re

def find_duplicate_attributes(file_path):
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Improved regex to find tags and their attributes
    # Handles multi-line tags better
    tags = re.finditer(r'<([a-zA-Z0-9:]+)\s+([^>]+)>', content, re.DOTALL)
    
    for match in tags:
        tag_name = match.group(1)
        tag_content = match.group(2)
        line_num = content.count('\n', 0, match.start()) + 1
        
        # Find all attributes
        # Looking for things like attr=, bind:attr=, class:name=, transition:name=
        attrs = re.findall(r'([a-zA-Z0-9:|:-]+)=', tag_content)
        
        seen = {}
        for attr in attrs:
            # For class:name, the attribute is just 'class' or 'class:name'
            # Svelte allows multiple class: directives but only one class attribute.
            # Wait, Svelte allows multiple class:name BUT they are unique by 'name'.
            # However, the error 'Attributes need to be unique' usually refers to standard attributes.
            
            # Extract the base attribute name (e.g., 'class' from 'class:foo', 'bind' from 'bind:value')
            base_attr = attr.split(':')[0]
            
            if base_attr in ['class', 'style'] and base_attr == attr:
                # Standard class or style attribute
                if base_attr in seen:
                    print(f"Duplicate attribute '{base_attr}' found in <{tag_name}> at line {line_num}")
                    print(f"Full tag content: {tag_content}")
                seen[base_attr] = True
            elif base_attr == attr:
                # Other standard attributes
                if attr in seen:
                    print(f"Duplicate attribute '{attr}' found in <{tag_name}> at line {line_num}")
                    print(f"Full tag content: {tag_content}")
                seen[attr] = True

if __name__ == "__main__":
    find_duplicate_attributes("/Users/jonathanhollander/AI Code/Notion Template/Continuum_SaaS/frontend/src/routes/marketing2/+page.svelte")
