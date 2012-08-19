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
