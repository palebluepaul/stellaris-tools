// Generated automatically by nearley, do not edit by hand
// Original grammar: stellaris.ne

// eslint-disable-next-line no-unused-vars
const moo = require('moo');

// Define the grammar
// Generated automatically by nearley, version unknown
// http://github.com/Hardmath123/nearley
(function () {
function id(x) { return x[0]; }

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

// Helper function to filter out whitespace and comments
function tokenFilter(tokens) {
  return tokens.filter(token => token.type !== 'ws' && token.type !== 'comment');
}
var grammar = {
    Lexer: lexer,
    ParserRules: [
    {"name": "main", "symbols": ["_", "statements", "_"], "postprocess": d => d[1]},
    {"name": "statements", "symbols": ["statement"], "postprocess": d => [d[0]]},
    {"name": "statements", "symbols": ["statements", "_", "statement"], "postprocess": d => [...d[0], d[2]]},
    {"name": "statement", "symbols": ["key", "_", {"literal":"="}, "_", "value"], "postprocess": d => ({ key: d[0], value: d[4] })},
    {"name": "key", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier)], "postprocess": d => d[0].value},
    {"name": "key", "symbols": [(lexer.has("string") ? {type: "string"} : string)], "postprocess": d => d[0].value},
    {"name": "value", "symbols": ["simple_value"], "postprocess": id},
    {"name": "value", "symbols": ["block"], "postprocess": id},
    {"name": "value", "symbols": ["array"], "postprocess": id},
    {"name": "simple_value", "symbols": [(lexer.has("string") ? {type: "string"} : string)], "postprocess": d => ({ type: 'string', value: d[0].value })},
    {"name": "simple_value", "symbols": [(lexer.has("number") ? {type: "number"} : number)], "postprocess": d => ({ type: 'number', value: d[0].value })},
    {"name": "simple_value", "symbols": ["boolean"], "postprocess": d => ({ type: 'boolean', value: d[0] })},
    {"name": "simple_value", "symbols": [(lexer.has("variable") ? {type: "variable"} : variable)], "postprocess": d => ({ type: 'variable', value: d[0].value })},
    {"name": "simple_value", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier)], "postprocess": d => ({ type: 'identifier', value: d[0].value })},
    {"name": "boolean", "symbols": [(lexer.has("yes") ? {type: "yes"} : yes)], "postprocess": d => true},
    {"name": "boolean", "symbols": [(lexer.has("no") ? {type: "no"} : no)], "postprocess": d => false},
    {"name": "block", "symbols": [{"literal":"{"}, "_", "statements", "_", {"literal":"}"}], "postprocess": d => ({ type: 'block', value: d[2] })},
    {"name": "block", "symbols": [{"literal":"{"}, "_", {"literal":"}"}], "postprocess": d => ({ type: 'block', value: [] })},
    {"name": "array", "symbols": ["simple_value"], "postprocess": d => ({ type: 'array', value: [d[0]] })},
    {"name": "array", "symbols": ["array", "_", "simple_value"], "postprocess": d => ({ type: 'array', value: [...d[0].value, d[2]] })},
    {"name": "_", "symbols": [], "postprocess": () => null},
    {"name": "_", "symbols": [(lexer.has("ws") ? {type: "ws"} : ws)], "postprocess": () => null},
    {"name": "_", "symbols": [(lexer.has("comment") ? {type: "comment"} : comment)], "postprocess": () => null},
    {"name": "_", "symbols": ["_", (lexer.has("ws") ? {type: "ws"} : ws)], "postprocess": () => null},
    {"name": "_", "symbols": ["_", (lexer.has("comment") ? {type: "comment"} : comment)], "postprocess": () => null}
]
  , ParserStart: "main"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();



