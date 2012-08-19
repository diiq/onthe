onthe
=====

I'm writing a self-hosted compiler, that will compile from a gently
improved javascript to standard javascript.

I'm calling the modified javascript 'Onthe'. Onthe is based on Douglas
Crockford's "Javascript: The Good Parts", aling with some nice ideas
from lisp, python, and anywhere else I feel like.

Mostly, I like the idea of coding for the web, but I think javascript
is nasty icky stuff. There's no chance of getting a better language to
have such complete adoption, and writing an optimizing compiler from
some existing language to javascript involves a lot of cleverness. It's
pretty easy, however, to institute minor cosmetic changes, and the
elimination of a number of features Crockford calls "bad" or even
"awful".

My goal is not to spend years writing a compiler -- I just want to
hate javascript less.

To ease development, the Onthe parser is currently written for node.js
--- but the changes necessary to adapt it to some other javascript
engine are trivial.


HACKING

The compiler comes in a few parts. There's the lexer, the parser, and
the code generator. Rather than do optimizations myself, I've chosen
to ship my raw, unoptimized code off to the google closure
compiler. They clean up the result, so that I don't have to.

The lexer is straightforward; the only unusual trait is that I define
names negatively, in terms of what characters they may not include,
rather than those they may. This will cause some trouble for me down
the line, when I have to translate those names into javascript-ready
identifiers, but it buys me some flexibility in naming --- I'm quite
fond of lisp-style names-with-en-dashes.

The parser is a top-down, Pratt-ish parser. See notes_on_pratt for how
I think about it.

The generator is very straighforward --- I practically started with
javascript, so reassembling it is hardly problematic.

All in all, it's about as simple a compiler as you can hope to see. It
looks to me like a good foundation for exploring language design; the
definition of the language is reasonably divided from the logic of hte
compiler --- though I hope to improve that division further. It's NOT
a compiler compiler by any means; I hope to have much better error
reporting than most generated parsers.