# psd-extractor [![NPM version][npm-image]][npm-url]
> extract font faces, sizes and colors from PSDs, accumulate and see their usage count.

[![NPM newer][nodei-image]][npm-url]

[npm-url]: https://npmjs.org/package/psd-extractor
[npm-image]: https://badge.fury.io/js/psd-extractor.png
[nodei-image]: https://nodei.co/npm-dl/psd-extractor.png?months=1


##cli

> Usage: psd-extractor `<file ...>`

to extract data from PSDs in current directory (`*.psd`) run:

```
$ psd-extractor
``` 


or pass list of files as arguments: 

```
$ psd-extractor foo.psd pages/*.psd
```

example output: [examples/extracted.json](https://github.com/safareli/psd-extractor/blob/master/examples/extracted.json)

##js

```javascript
var psdExtractor = require("psd-extractor")
var fooData = psdExtractor('foo.psd')
var pageData = psdExtractor('pages/*.psd')
var allData = psdExtractor(['foo.psd', 'pages/*.psd'])
```

