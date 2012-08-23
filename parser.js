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

var expression = function (precedence_prev) {
    var current, left;
    current = tokens.pop();
    log(current);
    left = fill(current);
    next = tokens.peek(); 
    while (precedence_prev < precedence(next)) {
             current = tokens.pop();
             left = fill(current, left);
             next = tokens.peek();
    }
    return left;
}

var an_expression = function () { return expression(0); };

var prefixes = {}
var infixes = {}
var precedences = {}

var fill = function (t, left) {
    if (left === undefined){
        if (prefixes[t.type] === undefined) {
            log("Undefined prefix operator:");
            op_fail(t);
        }
        return prefixes[t.type](t);
    } else {
        if (infixes[t.type] === undefined) {
            log("Undefined prefix operator:");
            op_fail(t, left);
        }
        return infixes[t.type](t, left);
    }
}

var precedence = function (t) {
    return precedences[t.type];
}

var op_fail = function (t, left) {
    log("Failed operation:", type, t, left); 
    throw {name: "failop"};
};

var infix = function (t, left) { 
    return ["infix", ["literal", t], left, expression(precedence(t.type))];
};

var prefix = function (t, left) { 
    return ["infix", ["literal", t], expression(precedence(t.type))];
};


var operator = function (type, p, infix, prefix) {
    prefix && (prefixes[type] = prefix);
    infix && (infixes[type] = infix);
    precedences[type] = p;
};

var functiony = function (t) {
        var args = [], code
        if (maybe("(")) {
            if (!maybe(")")){
                do {
                    args.push(an_expression());
                } while(maybe(","));
                expect(")");
            }
        }     
        code = block();
        return [t.type, args, code];
    };

var expect = function () {
    var expectone = function (t) {
        if (tokens.peek().type !== t) {
            log([t, tokens.peek()])
            throw {name: "expected", info: [t, tokens.peek()]}
        }
        tokens.pop();
        return true;
    }
    for (var i = 0; i<arguments.length; i++){
        if(!expectone(arguments[i])) return false;
    }
    return true;
}

var maybe = function (t) { 
    if (tokens.peek().type !== t) return false;
    return tokens.pop();
}


// Operators for expressions:

operator("(literal)",   0, null, function(t){ return ["literal", t]; });
operator("(end)", -1);
operator(".", 10, infix);
operator("not", 8, null, prefix);

operator("*", 7, infix); 
operator("/", 7, infix); 
operator("%", 7, infix); 

operator("+", 6, infix);
operator("-", 6, infix, prefix);

operator("==", 4, infix); 
operator("!=", 4, infix); 
operator(">=", 4, infix); 
operator("<=", 4, infix); 
operator(">",  4, infix); 
operator("<",  4, infix); 

operator("and", 3, infix);
operator("or", 2, infix);

operator("λ", 1, null, functiony);
operator("scope", 1, null, functiony);
operator("constructor", 1, null, functiony);

operator("?", 1, 
                 function (t, left) {
                     var test, then, els;
                     test = an_expression();
                     expect(":");
                     els = an_expression();
                     return ["?", test, then, els];
                 });

operator("(", 9, 
                 function(t, left) {
                     // invocation
                     if (!maybe(")")){
                         var args = [an_expression()];
                         while (maybe(",")) {
                             args.push(an_expression());
                         }
                         expect(")");
                     }
                     return ["invocation", left, args];
                 },
                 function(t){
                     // paren'd expression 
                     var exp = an_expression();
                     expect(")");
                     return exp;
                 });

operator("[", 9, 
                 function(t, left) {
                     // Refinement
                     var arg = an_expression();
                     expect("]");
                     return ["refinement", left, arg];
                 },
                 function(t){
                     // Array literal
                     var mems = [an_expression()];
                     while (maybe(",")) {
                         mems.push(an_expression());
                     }
                     expect("]");
                     return ["array", mems];
                 });

operator("{", 0, function(t){
                     // Array literal
                     var mems = [];
                     if (maybe(".")) {
                        mems.push(["object_pair", 
                                   ["literal", tokens.pop()], 
                                   an_expression()]);
                     }
                     while (maybe(",")) {
                         expect(".");
                         mems.push(["object_pair", 
                                    ["literal", tokens.pop()], 
                                    an_expression()]);
                     }
                     expect("}");
                     return ["object", mems];
                 });

// OK, time for statements!

var statements = {};

var statement = function () {
    var ret;
    if (statements[tokens.peek().type]) {
       ret = statements[tokens.pop().type]()
    } else {
       ret = expression(-1);
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

operator("=", 0, infix); 
operator("+=", 0, infix); 
operator("-=", 0, infix); 

statements["break"] = function () {
    t = maybe("(name)");
    return ["break", t];
}

statements["if"] = function () {
    var test, then, els;
    test = an_expression();
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
    sw = an_expression();
    expect(":", "dent", "indent");
    while (maybe("case")) {
        t = an_expression();
        b = block();
        cases.push(["case", t, b]);
        maybe("dent");
    }
    if (maybe("default")){
        cases.push(["default", block()]);
    }
    expect("dent", "dedent");
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
    v = an_expression(); // test for name/
    switch (tokens.pop().type) {
        case "in":
            n = an_expression();
            b = block();
            return ["forin", v, n];
        case "from":
            from = an_expression();
            expect("to");
            to = an_expression();
            if (maybe("by")) {
                by = an_expression();
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