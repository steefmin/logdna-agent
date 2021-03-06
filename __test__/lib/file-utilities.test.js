/* globals describe, it, beforeEach, after */

// External Modules
const async = require('async');
const debug = require('debug')('logdna:test:lib:file-utilities');
const fs = require('fs');
const path = require('path');
const properties = require('properties');
const rimraf = require('rimraf');

// Internal Modules
const fileUtilities = require('../../lib/file-utilities');
const utils = require('../../lib/utils');

// Constants
const configPath = './__test__/assets/testconfig.config';
const tempDir = '.temp';

describe('lib:file-utilities', () => {

    beforeEach((done) => {
        debug(`cleaning up test folder...${tempDir}`);
        return rimraf(tempDir, () => {
            fs.mkdirSync(tempDir);
            fs.mkdirSync(path.join(tempDir, 'subdir'));
            return done();
        });
    });

    afterAll(() => {
        return rimraf(tempDir, () => {
            return debug('Cleaned');
        });
    });

    describe('#getFiles()', () => {
        it('retrieves all *.log and extensionless files', () => {
            const testFiles = [
                path.join(tempDir, 'somelog1.log')
                , path.join(tempDir, 'somelog2')
                , path.join(tempDir, 'somelog3-file')
                , path.join(tempDir, 'somelog4-202f') // 3 digit number shouldn't match date stamp
                , path.join(tempDir, 'wtmp') // /var/log/wtmp shouldn't match cuz diff folder
            ];

            testFiles.forEach((testFile) => {
                fs.writeFileSync(testFile, 'arbitraryData\n');
            });

            fileUtilities.getFiles({}, tempDir, (error, array) => {
                debug(array);
                expect(array.length).toEqual(testFiles.length);
                expect(error).toBe(null);
            });
        });

        it('retrieves no *.log, nor extensionless files', () => {
            const testFiles = [
                path.join(tempDir, 'somelog1.log.1')
                , path.join(tempDir, 'somelog2.txt')
                , path.join(tempDir, 'testexclude') // in globalExclude
            ];

            testFiles.forEach((testFile) => {
                fs.writeFileSync(testFile, 'arbitraryData\n');
            });

            fileUtilities.getFiles({}, tempDir, (error, array) => {
                debug(array);
                expect(array.length).toEqual(0);
                expect(error).toBe(null);
            });
        });

        it('retrieves 1 file based on glob pattern *.txt', () => {
            const testFiles = [
                path.join(tempDir, 'somelog1.txt')
                , path.join(tempDir, 'subdir', 'somelog2.txt')
            ];

            testFiles.forEach((testFile) => {
                fs.writeFileSync(testFile, 'arbitraryData\n');
            });

            fileUtilities.getFiles({}, path.join(tempDir, '*.txt'), (error, array) => {
                debug(array);
                expect(array.length).toEqual(1);
                expect(error).toBe(null);
            });
        });

        it('retrieves 2 files based on glob pattern **/*.txt', () => {
            const testFiles = [
                path.join(tempDir, 'somelog1.txt')
                , path.join(tempDir, 'subdir', 'somelog2.txt')
                , path.join(tempDir, 'subdir', 'somelog3.log') // should fail since this dir doesn't define *.log
                , path.join(tempDir, 'subdir', 'somelog4') // should fail since this dir doesn't define extensionless
            ];

            testFiles.forEach((testFile) => {
                fs.writeFileSync(testFile, 'arbitraryData\n');
            });

            fileUtilities.getFiles({}, path.join(tempDir, '**', '*.txt'), (error, array) => {
                debug(array);
                expect(array.length).toEqual(2);
                expect(error).toBe(null);
            });
        });
    });

    describe('#appender()', () => {
        it('provides an appender that appends to end of array', () => {
            const func = utils.appender();

            func('x');
            func('y');
            const xs = func('z');

            debug(xs);
            expect(xs[0]).toEqual('x');
            expect(xs[1]).toEqual('y');
            expect(xs[2]).toEqual('z');
        });
    });

    describe('#saveConfig()', () => {
        it('saves a configuration to a file', () => {
            return async.waterfall([(cb) => {
                return properties.parse(configPath, {
                    path: true
                }, cb);
            }, (config, cb) => {
                return utils.saveConfig(config, path.join(tempDir, 'test.config'), cb);
            }, (success, cb) => {
                return properties.parse(configPath, {
                    path: true
                }, cb);
            }], (error, config) => {
                expect(config.key).toBeDefined();
                expect(config.autoupdate).toEqual(0);
            });
        });
    });
});
