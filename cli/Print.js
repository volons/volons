/* eslint-disable */
const useColor = process.stdout.isTTY ? true : false;

// from https://stackoverflow.com/questions/9781218/how-to-change-node-jss-console-font-color
const Reset = "\x1b[0m";
const Bright = "\x1b[1m";
const Dim = "\x1b[2m";
const Underscore = "\x1b[4m";
const Blink = "\x1b[5m";
const Reverse = "\x1b[7m";
const Hidden = "\x1b[8m";

const FgBlack = "\x1b[30m";
const FgRed = "\x1b[31m";
const FgGreen = "\x1b[32m";
const FgYellow = "\x1b[33m";
const FgBlue = "\x1b[34m";
const FgMagenta = "\x1b[35m";
const FgCyan = "\x1b[36m";
const FgWhite = "\x1b[37m";

const BgBlack = "\x1b[40m";
const BgRed = "\x1b[41m";
const BgGreen = "\x1b[42m";
const BgYellow = "\x1b[43m";
const BgBlue = "\x1b[44m";
const BgMagenta = "\x1b[45m";
const BgCyan = "\x1b[46m";
const BgWhite = "\x1b[47m";

class Print {

    // simple console.log
    log( msg ) {
        console.log( msg );
    }

    // console.log without carriage return
    logNoCR( msg ) {
        process.stdout.write( msg );
    }

    // error log if possible in bright red
    error( msg, obj ) {
        if ( useColor ) {
            if ( obj ) {
                console.log( `${ Bright }${ FgRed }${ msg }:${ Reset }` );
                console.log( `${ Bright }${ FgRed }${ obj }${ Reset }` );
            }
            else {
                console.log( `${ Bright }${ FgRed }${ msg }${ Reset }` );
            }
        }
        else {
            if ( obj )
                console.log( msg, obj );
            else
                console.log( msg );
        }
    }

    warn( msg ) {
        if ( useColor ) {
            console.log( `${ Bright }${ FgYellow }${ msg }${ Reset }` );
        }
        else {
            console.log( msg );
        }
    }
    // info log if possible in green
    info( msg ) {
        if ( useColor ) {
            console.log( `${ FgGreen }${ msg }${ Reset }` );
        }
        else {
            console.log( msg );
        }
    }
}

module.exports = new Print();
/* eslint-enable */
