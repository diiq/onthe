var test = require("./test.js");
var tests = {};
var log = console.log;

var ignore_newline_tokens = [",", "+", "-", "*", "/", "=", "and", "or"];
var ignore_newline_delimeters = [["(", ")"]];


escape = function(text) {
    return text.replace(/[\-\[\]\{\}\(\)\*\+\?\.\,\\\^\$\|\#\s]/g, "\\$&");
}

var strip_comments = function (s) {
    var rep = function (m) {
        return spaces(m.length-1) + "\n";
    }
    return s.replace(/\/\/.*?\n/gm, rep);
}

var strip_ignorables = function (s) {
    if (ignore_newline_tokens) {
        var ignored = "((";
        ignored += escape(ignore_newline_tokens[0]);
        for (var i = 1; i < ignore_newline_tokens.length; i++) {
            ignored +=  "|" + escape(ignore_newline_tokens[i]);
        }
        ignored += ") *)\\n";
        ignored = RegExp(ignored, "g");
        return s.replace(ignored, "$1 ");
    }
    return s;
};
tests.strip_ignorables = function () {
    var s = "hello\nthere\n    I am and\n    who are" +
            " you or\n  he?\nso, be, it, \n my \n friend";
    var r = strip_ignorables(s);
    return (r === "hello\nthere\n    I am and     who are you" +
                 " or   he?\nso, be, it,   my \n friend");
};

var spaces = function (n) {
    ret = "";
    for (var i =0 ; i<n; i++) ret+= " ";
    return ret;
};

var embraced = function (s) {
    var rep, i;
    indent_stack = [0];
    rep = function (m) {
        var i, ret;
        for (var i = m.length-1; m[i] === ' '; i--);
        i = m.length - i - 1;
        if (i > indent_stack[indent_stack.length-1]) {
            // Indentation!
            if (m[0] !== ":") { log(indent_stack); throw "some error thing" };
            indent_stack.push(i);
            return "{" + spaces(m.length - 1);
        } else if (i < indent_stack[indent_stack.length-1]) {
            ret = "";
            while (i < indent_stack[indent_stack.length-1]) {
                ret += ";}"
                indent_stack.pop();
            }
            return ret  + spaces(m.length - ret.length);;
        } else {
            return ";"  + spaces(m.length - 1);
        }
    }        
    return s.replace(/:?(\n *)+/gm, rep);
};
tests.embraced = function () {
    var s = "scope ():\n    this is a line\n    this is a " +
            "second\n\nand this is a third\n";
    var r = embraced(s);
    return r === "scope (){     this is a line;    this is a second;}and this is a third;"
};


var strip_whitespace = function (s) {
    return embraced(strip_ignorables(strip_comments(s)));
}

test.run(tests, "silent");

exports.strip_whitespace = strip_whitespace;
