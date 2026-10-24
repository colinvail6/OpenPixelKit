"use strict";

var os = require('os'),
    sn = require('../../utils/get-sn'),
    expect = require('chai').expect;

describe("Serial Number library", function () {
    it("Should return a string", function () {
        sn((err, serialNo) => {
            expect(err).toBeFalsy('Got Back an error');
            expect(serialNo).toBeA('string', 'What is returned is not a string');
            if (os.platform() === 'darwin') {
                expect(serialNo.length).to.be.onfOf([10,11]);
            }
        });
    });
    it("Should look like a SN", function () {
        sn((err, serialNo) => {
            expect(err).toBeFalsy('Got Back an error');
            // TODO (convolu) : Update this test once we know the format of the
            // SN on the board
            if (os.platform() === 'darwin') {
                expect(serialNo.length).to.be.onfOf([10,11]);
            }
        });
    });
});
