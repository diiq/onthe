var assert = function (t, m) {
    if (!t) {
        console.log("Test FAILED:\n    " + m);
    } else {
        console.log("pass %s.", m);
    }
};

var sassert = function (t, m) {
    if (!t) {
        throw {name : "failed_test", message : "Test FAILED:\n    " + m};
    }
};

exports.run = function (tests, flags) {
    assert = (flags === "silent") ? sassert : assert; 
    for (test in tests) {
        if (tests.hasOwnProperty(test)){
            assert(tests[test](), test);
        }
    }
};