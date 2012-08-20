var lexer = require("./lexer.js")
var test = require("./test.js");
var tests = {};
var log =  console.log;

// See notes_on_pratt
// At the moment, all operators have rbp === lbp. Is this always correct?
// Aha! No, it is not; see - as infix or prefix.

Array.prototype.peek = function () { return this[this.length - 1]; };

var token_stream = function (s) { return lexer.tokenize(s).reverse(); };

// Parsing expressions

var expression = function (prev_precedence, tokens) {
    var current, left;
    current = tokens.pop();
    left = fill(current, tokens);
    next = tokens.peek(); 
    while (prev_precedence < precedence(next)) {
             current = tokens.pop();
             left = fill(current, left, tokens);
             next = tokens.peek();
    }
    return left;
}

var fill = function (t, left, tokens) {
    if (tokens === undefined){
        tokens = left;
        return operators[t.type].prefix(t, tokens)
    }
    return operators[t.type].infix(t, left, tokens) 
}

var precedence = function (t) {
    if (operators[t.type])
        return operators[t.type].precedence;
    return -1;
}

var operators = {}

var add_operator = function (type, precedence, prefix, infix) {
    operators[type] = {prefix:prefix, infix:infix, precedence:precedence};
}

var add_infix = function (type, precedence) {
    add_operator(type, precedence,
                 function (t){  log(type, t); throw {name: "no"}; }, 
                 function (t, left, tokens) { 
                     return ["infix", ["literal", t], left, expression(this.precedence, tokens)];
                 });
};

var add_prefix = function (type, precedence) {
    add_operator(type, precedence,
                 function(t, tokens){
                     return ["prefix", t, expression(this.precedence, tokens)];
                 }, 
                 function () { throw {name: "no"}; });
};

var add_infix_class = function () {
    for(var i =0; i < arguments.length - 1; i++) {
        add_infix(arguments[i], arguments[arguments.length-1]);
    }
}

var add_functiony = function(trigger) {
    add_prefix(trigger, 1);
    operators[trigger].prefix = function (t, tokens) {
        var args = [], code
        if (maybe("(", tokens)) {
            if (!maybe(")", tokens)){
                do {
                    args.push(expression(0, tokens));
                } while(maybe(",", tokens));
                expect(")", tokens);
            }
        }             
        code = block(tokens)
        return [trigger, args, code];
    }
}
// Parsing statements

var expect = function (t, tokens) {
    if (tokens.peek().type !== t) {
        throw {name: "expected", info: [t, tokens.peek()]}
    }
    tokens.pop();
    return true;
}

var maybe = function (t, tokens) { 
    if (tokens.peek().type !== t) return false;
    return tokens.pop();
}

var statements = {};

var statement = function (tokens) {
    var ret;
    if (statements[tokens.peek().type]) {
       ret = statements[tokens.pop().type](tokens)
    } else {
       ret = expression(0, tokens);
    }
    expect("dent", tokens);
    return ret;
}

var statementi = function (tokens) {
    var ret = [];
    while (tokens.peek().type !== "dedent" && tokens.peek().type !== "(end)") {
       ret.push(statement(tokens));
    }
    return ret;
}

// Operators for expressions:

add_operator("(literal)", 0,
              function(t, tokens){ return ["literal", t]; }, 
              function() { throw {name: "literal_operator"}});
add_operator("(name)", 0,
              function(t, tokens){ return ["literal", t]; }, 
              function() { throw {name: "literal_operator"}});

add_operator("(end)", 0,
              function () { throw {name: "end_operator"} }, 
              function () { throw {name: "end_operator"}});

add_infix(".", 10);
add_prefix("not", 8);

add_infix_class("*", "/", "%", 7);

add_infix("+", 6);
add_infix("-", 6);
operators["-"].prefix = 
                 function(t, tokens){ 
                     return ["prefix", t, 
                             expression(0, tokens)];
                 }


add_infix_class("==", "!=", ">=", "<=", ">", "<", 4);

add_infix("and", 3);
add_infix("or", 2);

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
                     expect(")", tokens);
                     return ["invocation", left, args];
                 });

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

add_infix("{", 0);
operators["{"].postfix = function(t, tokens){
                     // Array literal
                     var mems = [];
                     if (maybe(".", tokens)) {
                        mems.push(["object_pair", 
                                   ["literal", tokens.pop()], 
                                   expression(0, tokens)]);
                     }
                     while (maybe(",", tokens)) {
                         expect(".", tokens);
                         mems.push(["object_pair", 
                                    ["literal", tokens.pop()], 
                                    expression(0, tokens)]);
                     }
                     expect("}", tokens);
                     return ["object", mems];
                 };




add_infix("?", 1);
operators["?"].infix = function (t, left, tokens) {
    var test, then, els;
    test = expression(0, tokens);
    expect(":", tokens);
    els = expression(0, tokens);
    return ["?", test, then, els];
}

add_functiony("λ");
add_functiony("scope");
add_functiony("constructor");

// OK, time for statements!

add_infix_class("=", "+=", "-=", 1); // magically takes care of assignment.

statements["break"] = function (tokens) {
    t = maybe("(name)", tokens);
    return ["break", t];
}

statements["if"] = function (tokens) {
    var test, then, els;
    test = expression(0, tokens);
    then = block(tokens);
    expect("dent", tokens);
    if (maybe("else", tokens)) {
        if (maybe("if", tokens)) {
            els = statements["if"](tokens);
        } else {
            els = block(tokens);
        }
    return ["ife", test, then, els];
    } else {
        tokens.push({type:"dent", value:"dent"});
    }
    return ["if", test, then];
}

statements["switch"] = function (tokens) {
    var sw, cases = [], t, b;
    sw = expression(0, tokens);
    expect(":", tokens);
    expect("dent", tokens);
    expect("indent", tokens);
    while (maybe("case", tokens)) {
        t = expression(0, tokens);
        b = block(tokens);
        cases.push(["case", t, b]);
        maybe("dent", tokens);
    }
    if (maybe("default", tokens)){
        cases.push(["default", block(tokens)]);
    }
    expect("dent", tokens);
    expect("dedent", tokens);
    return ["switch", sw, cases];
}

var block = function (tokens) {
    var ret;
    expect(":", tokens);
    if (maybe("dent", tokens)) {
        expect("indent", tokens);
        ret = ["block", statementi(tokens)];
        expect("dedent", tokens);
    } else {
        ret = ["block", [statement(tokens)]];
    }
    return ret;
}

statements["for"] = function (tokens) {
    var v, n, from, to, by, b;
    v = expression(0, tokens); // test for name/
    switch (tokens.pop().type) {
        case "in":
            n = expression(0, tokens);
            b = block(tokens);
            return ["forin", v, n];
        case "from":
            from = expression(0, tokens);
            expect("to", tokens);
            to = expression(0, tokens);
            if (maybe("by", tokens)) {
                by = expression(0, tokens);
            } else {
                by = ["literal", {type:"(literal)", value:1}];
            }
            b = block(tokens);
            return ["for", v, from, to, by, b];
        default:
            throw {name: "bad_for"};
    }
}

exports.statement = statement;
exports.expression = expression;
exports.token_stream = token_stream;