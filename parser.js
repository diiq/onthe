lexer = require("./lexer.js")
var test = require("./test.js");
var tests = {};
var log =  console.log;

/* OK, so I'm going to use a Pratt parser, and I've looked all around
 and failed to find a clear explanation of how they work. So I'm going
 to try, here. Imagine that every operator is made of boxes. A binary
 infix operator, like +, has two boxes; one on the left, and one on
 the right.
________   ________
|      |   |      |
|      | + |      |
|______|   |______|

Those boxes could hold atoms (like numbers) or whole expressions. To
grok a Pratt parser, think about operator precedence in terms of what
will fit in each box. Because we're looking at a left-associative
grammar, the left-hand box can hold ANYTHING. It's an infinitely larg
box.

The box on the right, on the other hand (quite literally), has a
specific, finite size. Another + can fit in the box. An expression
surrounded by () can fit (Think of parens like the squeezing ends of a
bookpress). But a * can't fit in the box --- it's too big. So when we
encounter

a + b * c

The a can go in +'s left-hand box; but b * c can't fit in the right. So we
put b in the right, and then the whole a + b expression in *'s left
--- because the left box is infinitely big.

Every token only needs to consider one thing to know what behavior to
take: is something being put in the left-hand box? Pratt calls the two
scenarios nud (null denotation, no left) and led (left denotation,
full left). I think these are silly names, and in languages that have
variadic functions, there's no reason to keep them separate: either
pass a left-side expression, or don't.

For reasons of both convention and practicality, precedence is
actually measured as 1/size : so an infinitely big box has precedence 0.

expression (prev_precedence, tokens):
    current = tokens.pop()
    left = current.fill(tokens)
    for (next = tokens.peek(); 
         prev_precedence < next.precedence;
         next = tokens.peek()):
        current = tokens.pop()
        left = current.fill(tokens, left)
    return left

*/

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
    log(t.type)
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

log(operators);
log(token_stream("2 + 2 * 3 / 4 - 5"));
log(expression(0, token_stream("2 + 2 * 3 / 4 - 5")));