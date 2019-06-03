f = open('congressional_districts.txt')
data = f.read().split(';')
f.close()
lines_out = []
states_to_include = ['IA', 'MI', 'NC', 'PA', 'MD', 'OH']
for state in states_to_include:
    lines_out.append('"'+state+'":{')
    for line in data:
        if 'attr' not in line:
            if 'path' in line and 'line' not in line and state in line:
                line = line.replace(' var ', '"')
                line = line.replace(' = rsr.path(', '": ')
                line = line.replace(')', '')
                line += ','
                lines_out.append(line)
    lines_out[len(lines_out)-1] = lines_out[len(lines_out)-1][0:len(lines_out[len(lines_out)-1])-1]
    if(states_to_include.index(state) < len(states_to_include)-1):
        lines_out.append("},")
    else:
        lines_out.append("}")

output_string = '\n\n'.join(lines_out)
if output_string[len(output_string)-1] == ',':
    output_string = output_string[0:len(output_string)-1]
output_string = 'var cds = {' + output_string + '}'
print output_string
f = open('htdocs/selected_cds.js', 'w')
f.write(output_string)
f.close()
