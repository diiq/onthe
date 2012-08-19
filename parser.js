lexer = require("./lexer.js")
var test = require("./test.js");
var tests = {};
var log =  console.log;

// See notes_on_pratt

Array.prototype.peek = function () { return this[this.length - 1]; };

var token_stream = function (s) { return lexer.tokenize(s).reverse(); };


var expression = function (prev_precedence, tokens) {
    var current, left;
    current = tokens.pop();
    left = fill(current, tokens);
    next = tokens.peek(); 
    while (prev_precedence < precedence(next)) {
             current = tokens.pop();
             next = tokens.peek();
             left = fill(current, left, tokens);
    }
    return left;
}

var fill = function (t, left, tokens) {
    if (tokens === undefined){
        tokens = left;
        return operators[t.type].prefix(t, tokens)
    }
    return operators[t.type].postfix(t, left, tokens) 
}

var precedence = function (t) {
    return operators[t.type].precedence;
}

var operators = {}

var add_operator = function (type, precedence, prefix, postfix) {
    operators[type] = {prefix:prefix, postfix:postfix, precedence:precedence};
}

var add_infix = function (type, precedence) {
    add_operator(type, precedence,
                 function(t, tokens){ }, 
                 function(t, left, tokens) { return ["infix", t, left, expression(this.precedence, tokens)];});
};


add_operator("literal", 0,
              function(t, tokens){ return t; }, 
              function() { throw {name: "literal_operator"}});
add_operator("(end)", 0,
              function () { throw {name: "end_operator"} }, 
              function () { throw {name: "end_operator"}});
add_infix("*", 60);
add_infix("/", 60);
add_infix("+", 10);
add_infix("-", 10);

log(expression(0, token_stream("2 + 2 * 3 / 4 - 5")));