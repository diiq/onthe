var fs = require("fs");
var parser = require("./parser.js");
var test = require("./test.js");

var tests = {};
var log =  console.log;

var listify = function (list, sep) {
    if (!list || list[0] === undefined) return "";
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

var generators = {};

var javascript = function (t) {
    if (t[0] === "literal") return t[1].value;
    return compose(generators[t[0]], t);
}

var generate = function (file) {
    s = fs.readFileSync(file, 'ascii');

    var t = parser.statements(parser.token_stream(s))
    var ret = "";
    for(var i =0; i<t.length; i++){
        ret += javascript(t[i]) + ";";
    }
    return ret;
}

generators["infix"] = "(%2%1%3)";
 
generators["invocation"] = "%1(%L,2)";

generators["array"] = "[%L,1]";

generators["refinement"] = "%1[%2]";

generators["object"] = "{%L,1}";

generators["object_pair"] = "%1:%2";

generators["?"] = "%1?%2:%3";

generators["if"] = "if(%1)%2";

generators["ife"] = "if(%1)%2else %3";

generators["while"] = "while(%1)%2";

generators["λ"] = "function (%L,1)%2";

generators["scope"] = "+function (%L,1)%2(%L,1)";

generators["constructor"] = "+function(){var It=function(%L,1)%2; return function(%L,1){return new It();};}()";

generators["block"] = "{%L;1;}";

generators["switch"] = "switch(%1){%L;2}";

generators["case"] = "case(%1):%2";

generators["default"] = "default:%1";

generators["for"] = "for (%1 = %2; %1 < %3; %1 += %4) %5";

generators["let"] = "var %L,1";

exports.javascript = javascript;
exports.generate = generate;