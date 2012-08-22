var lexer = require("./lexer.js")
var test = require("./test.js");
var tests = {};
var log =  console.log;

// See notes_on_pratt

// At the moment, all operators have rbp === lbp. Is this always correct?
// Aha! No, it is not; see - as infix or prefix.

Array.prototype.peek = function () { return this[this.length - 1]; };

var tokens;
var token_stream = function (s) { tokens = lexer.tokenize(s).reverse(); };
// Parsing expressions

var expression = function (prev_precedence) {
    var current, left;
    current = tokens.pop();
    left = fill(current);
    next = tokens.peek(); 
    while (prev_precedence < precedence(next)) {
             current = tokens.pop();
             left = fill(current, left);
             next = tokens.peek();
    }
    return left;
}

var operators = {}

var fill = function (t, left) {
    if (left === undefined){
        if (operators[t.type] === undefined) {
            log(t.type, "UNDEFINED!");
        }
        return operators[t.type].prefix(t)
    }
    return operators[t.type].infix(t, left) 
}

var precedence = function (t) {
    if (operators[t.type])
        return operators[t.type].precedence;
    return -1;
}

var add_operator = function (type, precedence, prefix, infix) {
    operators[type] = {prefix:prefix, infix:infix, precedence:precedence};
}

var add_infix = function (type, precedence) {
    add_operator(type, precedence,
                 function (t){  log(type, t); throw {name: "no"}; }, 
                 function (t, left) { 
                     return ["infix", ["literal", t], left, expression(this.precedence)];
                 });
};

var add_prefix = function (type, precedence) {
    add_operator(type, precedence,
                 function(t){
                     return ["prefix", t, expression(this.precedence)];
                 }, 
                 function (t) { log(type, t); throw {name: "no"}; });
};

var add_infix_class = function () {
    for(var i =0; i < arguments.length - 1; i++) {
        add_infix(arguments[i], arguments[arguments.length-1]);
    }
}

var add_functiony = function(trigger) {
    add_prefix(trigger, 1);
    operators[trigger].prefix = function (t) {
        var args = [], code
        if (maybe("(")) {
            if (!maybe(")")){
                do {
                    args.push(expression(0));
                } while(maybe(","));
                expect(")");
            }
        }     
        code = block();
        return [trigger, args, code];
    }
}
// Parsing statements

var expect = function (t) {
    if (tokens.peek().type !== t) {
        log([t, tokens.peek()])
        throw {name: "expected", info: [t, tokens.peek()]}
    }
    tokens.pop();
    return true;
}

var maybe = function (t) { 
    if (tokens.peek().type !== t) return false;
    return tokens.pop();
}

var statements = {};

var statement = function () {
    var ret;
    if (statements[tokens.peek().type]) {
       ret = statements[tokens.pop().type]()
    } else {
       ret = expression(0);
    }
    expect("dent");
    return ret;
}

var statementi = function () {
    var ret = [];
    while (tokens.peek().type !== "dedent" && tokens.peek().type !== "(end)") {
       ret.push(statement());
    }
    return ret;
}

// Operators for expressions:

add_operator("(literal)", 0,
              function(t){ return ["literal", t]; }, 
              function() { throw {name: "literal_operator"}});
add_operator("(name)", 0,
              function(t){ return ["literal", t]; }, 
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
                 function(t){ 
                     return ["prefix", t, 
                             expression(0)];
                 }


add_infix_class("==", "!=", ">=", "<=", ">", "<", 4);

add_infix("and", 3);
add_infix("or", 2);

add_operator("(", 9, 
                 function(t){
                     // paren'd expression 
                     var exp = expression(0);
                     expect(")");
                     return exp;
                 }, 
                 function(t, left) {
                     // invocation
                     if (!maybe(")")){
                         var args = [expression(0)];
                         while (maybe(",")) {
                             args.push(expression(0));
                         }
                         expect(")");
                     }
                     return ["invocation", left, args];
                 });

add_operator("[", 9, 
                 function(t){
                     // Array literal
                     var mems = [expression(0)];
                     while (maybe(",")) {
                         mems.push(expression(0));
                     }
                     expect("]");
                     return ["array", mems];
                 }, 
                 function(t, left) {
                     // Refinement
                     var arg = expression(0);
                     expect("]");
                     return ["refinement", left, arg];
                 });

add_infix("{", 0);
operators["{"].postfix = function(t){
                     // Array literal
                     var mems = [];
                     if (maybe(".")) {
                        mems.push(["object_pair", 
                                   ["literal", tokens.pop()], 
                                   expression(0)]);
                     }
                     while (maybe(",")) {
                         expect(".");
                         mems.push(["object_pair", 
                                    ["literal", tokens.pop()], 
                                    expression(0)]);
                     }
                     expect("}");
                     return ["object", mems];
                 };




add_infix("?", 1);
operators["?"].infix = function (t, left) {
    var test, then, els;
    test = expression(0);
    expect(":");
    els = expression(0);
    return ["?", test, then, els];
}

add_functiony("λ");
add_functiony("scope");
add_functiony("constructor");

// OK, time for statements!

add_infix_class("=", "+=", "-=", 1); // magically takes care of assignment.

statements["break"] = function () {
    t = maybe("(name)");
    return ["break", t];
}

statements["if"] = function () {
    var test, then, els;
    test = expression(0);
    then = block();
    expect("dent");
    if (maybe("else")) {
        if (maybe("if")) {
            els = statements["if"]();
        } else {
            els = block();
        }
    return ["ife", test, then, els];
    } else {
        tokens.push({type:"dent", value:"dent"});
    }
    return ["if", test, then];
}

statements["switch"] = function () {
    var sw, cases = [], t, b;
    sw = expression(0);
    expect(":");
    expect("dent");
    expect("indent");
    while (maybe("case")) {
        t = expression(0);
        b = block();
        cases.push(["case", t, b]);
        maybe("dent");
    }
    if (maybe("default")){
        cases.push(["default", block()]);
    }
    expect("dent");
    expect("dedent");
    return ["switch", sw, cases];
}

var block = function () {
    var ret;
    expect(":");
    if (maybe("dent")) {
        expect("indent");
        ret = ["block", statementi()];
        expect("dedent");
    } else {
        ret = ["block", [statement()]];
    }
    return ret;
}

statements["for"] = function () {
    var v, n, from, to, by, b;
    v = expression(0); // test for name/
    switch (tokens.pop().type) {
        case "in":
            n = expression(0);
            b = block();
            return ["forin", v, n];
        case "from":
            from = expression(0);
            expect("to");
            to = expression(0);
            if (maybe("by")) {
                by = expression(0);
            } else {
                by = ["literal", {type:"(literal)", value:1}];
            }
            b = block();
            return ["for", v, from, to, by, b];
        default:
            throw {name: "bad_for"};
    }
}

exports.statement = statement;
exports.expression = expression;
exports.token_stream = token_stream;