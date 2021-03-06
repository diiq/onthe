var generator = require("./generator.js")
var lexer = require("./lexer.js")
var querystring = require('querystring');
var http = require('http');


var closure_compiled = function(code){
    var post_data = querystring.stringify({
        js_code : code,
        output_info: 'compiled_code',
        formatting: 'pretty_print'});

    var post_options = {
        host: 'closure-compiler.appspot.com',
        path: '/compile',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': post_data.length
            }
        };

    var post_req = http.request(post_options, function(res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            console.log(chunk);
        });
    });

    // write parameters to post body
    post_req.write(post_data);
    post_req.end();

};


closure_compiled(generator.generate(process.argv[2]));
