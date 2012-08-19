lexer = require("./lexer.js")
var test = require("./test.js");
var tests = {};
var log =  console.log;

// See notes_on_pratt
// At the moment, all operators have rbp === lbp. Is this correct?
// Aha! No, it is not; see - as infix or prefix.

Array.prototype.peek = function () { return this[this.length - 1]; };

var token_stream = function (s) { return lexer.tokenize(s).reverse(); };

var expect = function (t, tokens) {
    log(tokens.peek()); 
    if (tokens.peek().type !== t) {
        throw {name: "expected", info: t}
    }
    tokens.pop();
    return true;
}

var maybe = function (t, tokens) { 
    if (tokens.peek().type !== t) return false;
    tokens.pop();
    return true;
}

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
                 function(t, tokens){  throw {name: "no"}; }, 
                 function(t, left, tokens) { return ["infix", t, left, expression(this.precedence, tokens)];});
};

var add_prefix = function (type, precedence) {
    add_operator(type, precedence,
                 function(t, tokens){return ["prefix", t, expression(this.precedence, tokens)] }, 
                 function(t, left, tokens) { throw {name: "no"}; });
};

var add_infix_class = function () {
    for(var i =0; i < arguments.length - 1; i++) {
        add_infix(arguments[i], arguments[arguments.length-1]);
    }
}

add_operator("(literal)", 0,
              function(t, tokens){ return ["literal", t]; }, 
              function() { throw {name: "literal_operator"}});
add_operator("name", 0,
              function(t, tokens){ return ["literal", t]; }, 
              function() { throw {name: "literal_operator"}});

add_operator("(end)", 0,
              function () { throw {name: "end_operator"} }, 
              function () { throw {name: "end_operator"}});

add_infix(".", 10);
add_prefix("not", 8);

add_infix_class("*", "/", "%", 7);

add_infix("+", 6);
add_operator("-", 6, 
                 function(t, tokens){ 
                     return ["prefix", t, 
                             expression(0, tokens)];
                 }, 
                 function(t, left, tokens) { 
                     return ["infix", t, left, 
                             expression(0, tokens)];
                 });

add_infix_class("==", "!=", ">=", "<=", ">", "<", 4);

add_infix("and", 3);
add_infix("or", 2);

add_operator(",", -1);
add_operator(")", -1);
 
add_operator("(", 9, 
                 function(t, tokens){
                     // paren'd expression 
                     var exp = expression(0, tokens);
                     expect(")", tokens);
                     return exp;
                 }, 
                 function(t, left, tokens) {
                     // invocation
                     var args = [expression(0, tokens)];
                     while (maybe(",", tokens)) {
                         args.push(expression(0, tokens));
                     }
                     return ["invocation", left, args];
                 });

add_operator("]", -1);
add_operator("[", 9, 
                 function(t, tokens){
                     // Array literal
                     var mems = [expression(0, tokens)];
                     while (maybe(",", tokens)) {
                         mems.push(expression(0, tokens));
                     }
                     expect("]", tokens);
                     return ["array", mems];
                 }, 
                 function(t, left, tokens) {
                     // Refinement
                     var arg = expression(0, tokens);
                     expect("]", tokens);
                     return ["refinement", left, arg];
                 });


exports.expression = expression;
exports.token_stream = token_stream;