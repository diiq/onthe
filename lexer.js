//[TODO: significant whitespace!]
var test = require("./test.js");
var tests = {};
var log = console.log;
var all_true = function () {
    var ret = {};
    for (var i = 0; i < arguments.length; i++){
        ret[arguments[i]] = true;
    }
    return ret;
}

// *** Token classes (excluding names and numbers!) ***

// Strings and regexs are 'delimited' tokens, comsuming all characters
// between.
var delimiters = ["\"", "\'"] //, "/"]; // how to distinguish between
                                        // division and regex? r"

var invalid_name_initials = ["-"]; // Digits are assumed.

var invalid_name_characters = ["(", ")", "[", "]", ",", ";", ".", " ", "{", "}", ":", "n"];

// Keywords are names with language-specific global meaning. 
// [TODO consider if these can just be names.]
var keywords = all_true("break", "case", "catch", "continue", "default",
                  "delete", "else", "finally", "for",
                  "if", "in", "instanceof", "switch", "this", "throw",
                  "try", "typeof", "while", "λ", "*", "/",
                  "%", "+", "-", ">", "<", ">=", "<=", "+=", "-=",
                  "==", "!=", "and", "or", "=");

// *** Character ,Classes ***
// These are utilities for parsing.

var digit = function (c) { return c <= "9" && c >= "0"; }

var cchar = function (s, i, c) { return s[i] === c ? i+1 : false; }

var spaces = function (s, i) { 
    for(; s[i] === ' '; i++);
    if (s[i] === "/" && s[i+1] === "/")
        for(; s[i] !== '\n'; i++);
    return i;
}

// *** Lexers ***

var indent_stack = [0]; // TODO: hide in a closure, so I can lex concurrently
var dented = false;
var indent = function (s, i) {
    log(i, indent_stack, dented);
    var j = 1;
    for(; s[i+j] === ' '; j++);
    if (!dented) {
        dented = true;
        return {from : i, to : i, type : "dent", value : "dent"};
    }
    dented = false;
    if (j-1 > indent_stack[indent_stack.length-1]) { // Indent!
        indent_stack.push(j-1);
        return {from : i, to : i+j, type : "indent", value : "indent"};
    }
    if (j-1 < indent_stack[indent_stack.length-1]) { // dendent!
        indent_stack.pop();
        return {from : i, to : i, type : "dedent", value : "dedent"};
    }
    return false;
}

var delimited = function (s, i, del) {
    var j = i;

    if (s[i] !== del) return false;

    while (j == i || s[j - 1] == '\\') {
        for (j += 1; s[j] != del; j += 1) {
            if (s[j] === '\\') j++;  // To skip escaped single chars.
        }
        if (j >= s.length) { 
            throw {name: "string_unterm", info: [del, s, i]};
        }
    }
    j += 1;
    return {from: i, to: j, type: "(literal)", value: s.slice(i, j)};
}

tests.delimited = function () {
    return delimited("\"he\\\"llo\"**", 0, "\"").value == "\"he\\\"llo\"";
}

var number = function (s, i) {
    var index, ret, a, retr;

    // This should be simple, but parseFloat doesn't say *where* it stops.
    index = i
    ret = parseFloat(s.slice(i, s.length))
    retr = function () {
        return {from: index,
                to: i,
                type: "(literal)",
                value: ret}
    }
    // Integer
    for (i; digit(s[i]); i += 1);

    // Fraction
    j = cchar(s, i, '.');
    if (!j) return retr();

    for (i = j; digit(s[i]); i++);

    // Exponent
    j = cchar(s, i, 'e') || cchar(s, i, 'E');
    if (!j) return retr();

    j = cchar(s, i, '+') || cchar(s, i, '-');
    if (j) i = j;

    j = i;
    for (i; digit(s[i]); i++);
    if (a == i) {
        throw { name: "number_bad_exponent",
               info: [s, index]}
    }
    return retr();
}
tests.number = function () {
    return number("2.5e-5**", 0).value === 2.5e-5;
}

var matcher = function () {
    var ret = "";
    for (var i = 0; i < invalid_name_characters.length; i++) {
        ret += "\\" + invalid_name_characters[i] + "|";
    }
    return new RegExp(ret.slice(0, ret.length - 1) + "");
}();

var token_at = function (s, i) {
    var word, nl;
    i = spaces(s, i);

    // Indent, dedent
    if (s[i] === "\n") {
        nl = indent(s, i);
        if (nl) return nl;
        i = spaces(s, i+1);
    }
    // Strings
    if (delimiters.indexOf(s[i]) !== -1) return delimited(s, i, s[i]);

    // Numbers
    if (digit(s[i])) return number(s, i, s[i]);

    if (invalid_name_characters.indexOf(s[i]) !== -1 ||
        invalid_name_initials.indexOf(s[i]) !== -1){
         return {from: i, to: i+1, type: s[i], value: s[i]};
    }
    word = s.slice(i, s.length).split(matcher)[0];

    // Keywords
    if (keywords[word]) return {from: i, to: i+word.length, type: word, value: word};

    // Literals
    return {from: i, to: i+word.length, type: "(name)", value: word};
}

tests.token_at = function () {
    var t, i, s;
    i = 0;
    s = "call while fart \"helllo\" (/ag asdat f/, 2)";
    while (i < s.length) {
        t = token_at(s, i);
        i = t.to;
    }
    return t.value === ')';
}

var tokenize = function (s) {
    var ret = [], i = 0;
    while (i < s.length) {
        ret.push(token_at(s, i));
        i = ret[ret.length - 1].to;
    }
    ret.push({from:i, to:i, type:"dent", value:"dent"});
    ret.push({from:i, to:i, type:"(end)", value:"(end)"});
    return ret;
}

exports.token_at = token_at;
exports.tokenize = tokenize;
test.run(tests, "silent");

