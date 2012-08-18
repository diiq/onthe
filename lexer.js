var test = require("./test.js");

// *** Token classes (excluding names and numbers!) ***

// Strings and regexs are 'delimited' tokens, comsuming all characters
// between.
var delimiters = obj("\"", "\'", "/"); 

// Prefixes are characters that cannot start a name, because they have
// specific meaning at the start of an expression.
var prefix = obj("+", "-", "!", "(", "[")

// Postfix characters cannot appear *anywhere* in a name.
var postfix_char = obj("(", ")", "[", "]", ",", ";");

// Keywords are names with language-specific global meaning.
var keyword = obj("break", "case", "catch", "continue", "default",
                  "delete", "else", "finally", "for", "function",
                  "if", "in", "instanceof", "switch", "this", "throw",
                  "try", "typeof", "while", "with", "λ", "*", "/",
                  "%", "+", "-", ">", "<", ">=", "<=", "+=", "-=",
                  "===", "!==", "&&", "||");

// *** Character Classes ***
// These are utilities for parsing.

var digit = function (c) { return c <= 9 && c >= 0; }

var cchar = function (s, i, c) { return s[i] === c ? i+1 : false }

var spaces = function (s, i) { 
    for(; s[i] === ' '; i++);
    return i;
}


// *** Parsers ***

var delimited = function (del) {
        log(del);
        if (s[i] !== del) return false;
        var j = i;

        do {
            for (j += 1; s[j] !== del; j++);
            if (j >= s.length) throw {name : "stringy", info : [del, s, i]}
        } while (s[j - 1] === '\\');

        j += 1;
        return [j, s.slice(i, j)];
    }

var delimited_literal = function (s, i) {
    var ret, dstring;

    for (type in multiword){ 
       if (multiword.hasOwnProperty(type) && multiword[type].delimeter){
            ret = dstring(multiword[type].delimeter);
            if (ret) return [ret[0], multiword[type].tokener(ret[1])];
        }
    }
};
tests.multiword_literal = function () {
    return multiword_literal("\"he\\\"llo\"**", 0)[1].value == "\"he\\\"llo\"";
};
