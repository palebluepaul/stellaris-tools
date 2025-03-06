@{%
// Import lexer if we decide to use one
const moo = require('moo');

// Define lexer rules
const lexer = moo.compile({
  ws: { match: /[ \t\n\r]+/, lineBreaks: true },
  comment: { match: /#+[^\n]*/, lineBreaks: false },
  string: { match: /"(?:\\["\\]|[^\n"\\])*"/, value: s => s.slice(1, -1) },
  identifier: { match: /[a-zA-Z0-9_\-\.]+/ },
  equals: '=',
  lbrace: '{',
  rbrace: '}',
  yes: 'yes',
  no: 'no',
  number: { match: /-?(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)/, value: s => Number(s) },
  variable: { match: /@[a-zA-Z0-9_\-\.]+/, value: s => s.slice(1) }
});
%}

# Pass your lexer object using the @lexer option
@lexer lexer

# Main rule for a complete file
main -> _ statements _ {% d => d[1] %}

# Multiple statements
statements -> statement {% d => [d[0]] %}
            | statements _ statement {% d => [...d[0], d[2]] %}

# A single statement (key-value pair or block)
statement -> key _ "=" _ value {% d => ({ key: d[0], value: d[4] }) %}

# Key can be an identifier or a string
key -> %identifier {% d => d[0].value %}
     | %string {% d => d[0].value %}

# Value can be various types
value -> simple_value {% id %}
       | block {% id %}
       | array {% id %}

# Simple values (string, number, boolean, variable)
simple_value -> %string {% d => ({ type: 'string', value: d[0].value }) %}
              | %number {% d => ({ type: 'number', value: d[0].value }) %}
              | boolean {% d => ({ type: 'boolean', value: d[0] }) %}
              | %variable {% d => ({ type: 'variable', value: d[0].value }) %}
              | %identifier {% d => ({ type: 'identifier', value: d[0].value }) %}

# Boolean values
boolean -> %yes {% d => true %}
         | %no {% d => false %}

# Block (object with nested key-value pairs)
block -> %lbrace _ statements _ %rbrace {% d => ({ type: 'block', value: d[2] }) %}
       | %lbrace _ %rbrace {% d => ({ type: 'block', value: [] }) %}

# Array (list of values)
array -> simple_value {% d => ({ type: 'array', value: [d[0]] }) %}
       | array _ simple_value {% d => ({ type: 'array', value: [...d[0].value, d[2]] }) %}

# Optional whitespace
_ -> null {% () => null %}
   | %ws {% () => null %}
   | %comment {% () => null %}
   | _ %ws {% () => null %}
   | _ %comment {% () => null %} 