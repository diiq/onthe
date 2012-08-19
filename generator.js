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
    }
}

var s = "(2 + {.name 3 + 3, .fars \n    6 * 2}) * \n[1, 2, 3] / 4 - ham.sand(foo[2], 5 + 6, gee)"

log(lexer.tokenize(s));
var t = parser.expression(0, parser.token_stream(s))
log(javascript(t));
