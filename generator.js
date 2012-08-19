var parser = require("./parser.js");
var lexer = require("./lexer.js");
var test = require("./test.js");
var tests = {};
var log =  console.log;


// tree recursion
var listify = function (list, sep) {
    var ret = javascript(list[0]);
    for (var i=1; i<list.length; i++){
        ret += sep + javascript(list[i]);
    }
    return ret;
}

var javascript = function (t) {
    switch (t[0]) {
        case "infix": 
            return ("(" + javascript(t[2]) + 
                    " " + t[1].value + " " + 
                          javascript(t[3]) + ")"); 
        case "literal":
            return t[1].value;

        case "invocation":
            return javascript(t[1]) + "(" + listify(t[2], ", ") + ")";

        case "array":
            return  "[" + listify(t[1], ", ") + "]";

        case "refinement":
            return javascript(t[1]) + "[" + javascript(t[2]) + "]";

        case "object":
            return  "{" + listify(t[1], ", ") + "}";

        case "object_pair":
            return javascript(t[1]) + " : " + javascript(t[2]);

        case "?": // ternary
            return javascript(t[1]) + " ? " + javascript(t[2]) + " : " + javascript(t[3]);

        case "if" :
            return " if (" +javascript(t[1]) + ")" +
                           javascript(t[2]) +
                   (t[3] ? javascript(t[3]) : "");

        case "while" :
            return " while (" + javascript(t[1]) + ")" + javascript(t[2]);

        case "λ" :
            return " function (" + listify(t[1], ",") + ")" + javascript(t[2]);

        case "block" :
            return "{" + listify(t[1], ";") + ";}";

        case "switch" :
            return "switch (" + javascript(t[1]) + ") {" + listify(t[2], "\n") + "}";

        case "case" :
            return "case (" + javascript(t[1]) + ") : " + javascript(t[2]);

        case "default" :
            return "default: " + javascript(t[1]);

        default :
            return t[0] + " (" + javascript(t[1]) + ");";
    }
}

var fs = require("fs");
s = fs.readFileSync('test.onthe', 'ascii');

log(parser.token_stream(s))
var t = parser.statement(parser.token_stream(s))
log(javascript(t));
