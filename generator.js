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

var compose = function (str, arr) {
    var rep, i=-1;
    rep = function (m) {
        if (m[1] === "L") {
            return listify(arr[m.slice(3, m.length)], m[2]);
        }
        return javascript(arr[m.slice(1, m.length)]);
    }
    return str.replace(/\%(L.+?)?\d/g, rep);
}

var javascript = function (t) {
    switch (t[0]) {
        case "infix": 
            return compose("(%2 " + t[1].value + " %3)", t);
 
        case "literal":
            return t[1].value;

        case "invocation":
            return compose("%1(%L,2)", t);

        case "array":
            return  compose("[%L,1]", t);

        case "refinement":
            return compose("%1[%2]", t);

        case "object":
            return  compose("{%L,1}", t);

        case "object_pair":
            return compose("%1:%2", t);

        case "?": // ternary
            return compose("%1?%2:%3", t);

        case "if" :
            return compose((t[3] ? "if(%1)%2else %3" :"if(%1)%2"), t);

        case "while" :
            return compose(" while(%1)%2", t);

        case "λ" :
            return compose(" function (%L,1)%2", t)

        case "block" :
            return compose("{%L;1;}", t);

        case "switch" :
            return compose(" switch (%1){%L;2}", t);

        case "case" :
            return compose("case (%1):%2", t);

        case "default" :
            return compose("default:%1", t);

        case "for" :
            return compose(" for (%1 = %2; %1 < %3; %1 += %4) %5", t);

        default :
            return compose(" %0 %1;", t);
    }
}

var fs = require("fs");

var generate = function (file) {
    s = fs.readFileSync(file, 'ascii');

    var t = parser.statement(parser.token_stream(s))
    return javascript(t);
}
exports.javascript = javascript;
exports.generate = generate;