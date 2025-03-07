import fs from "fs";
import path from "path";
import fcl from "@onflow/fcl";
import {
    Address,
    Array as tArray,
    Dictionary,
    String as tString,
    UInt64,
} from "@onflow/types";
import { validate } from "./lib/utils";

const cadenceTestingSuite =
    describe("Mainnet Metadata Regression Tests", () => {
        const testGetNFTIDsScript = fs.readFileSync(
            path.resolve(__dirname, "../src/cadence/mainnet/testGetNFTIDs.sh"),
            "utf-8"
        );
        const getNFTIDsV1 = fs.readFileSync(
            path.resolve(__dirname, "../src/cadence/mainnet/getNFTIDs.cdc"),
            "utf-8"
        );
        const getNFTIDsStaging1 = fs.readFileSync(
            path.resolve(
                __dirname,
                "../src/cadence/scripts/v2/mainnet/staging/getNFTIDsShard1.cdc"
            ),
            "utf-8"
        );
        const getNFTIDsStaging2 = fs.readFileSync(
            path.resolve(
                __dirname,
                "../src/cadence/scripts/v2/mainnet/staging/getNFTIDsShard2.cdc"
            ),
            "utf-8"
        );
        const getNFTIDsStaging3 = fs.readFileSync(
            path.resolve(
                __dirname,
                "../src/cadence/scripts/v2/mainnet/staging/getNFTIDsShard3.cdc"
            ),
            "utf-8"
        );
        const getNFTIDsStaging4 = fs.readFileSync(
            path.resolve(
                __dirname,
                "../src/cadence/scripts/v2/mainnet/staging/getNFTIDsShard4.cdc"
            ),
            "utf-8"
        );

        const testGetNFTsScript = fs.readFileSync(
            path.resolve(__dirname, "../src/cadence/mainnet/testGetNFTs.sh"),
            "utf-8"
        );
        const getNFTsV1 = fs.readFileSync(
            path.resolve(__dirname, "../src/cadence/mainnet/getNFTs.cdc"),
            "utf-8"
        );
        const getNFTsStaging1 = fs.readFileSync(
            path.resolve(
                __dirname,
                "../src/cadence/scripts/v2/mainnet/staging/getNFTsShard1.cdc"
            ),
            "utf-8"
        );
        const getNFTsStaging2 = fs.readFileSync(
            path.resolve(
                __dirname,
                "../src/cadence/scripts/v2/mainnet/staging/getNFTsShard2.cdc"
            ),
            "utf-8"
        );
        const getNFTsStaging3 = fs.readFileSync(
            path.resolve(
                __dirname,
                "../src/cadence/scripts/v2/mainnet/staging/getNFTsShard3.cdc"
            ),
            "utf-8"
        );
        const getNFTsStaging4 = fs.readFileSync(
            path.resolve(
                __dirname,
                "../src/cadence/scripts/v2/mainnet/staging/getNFTsShard4.cdc"
            ),
            "utf-8"
        );

        // Grab all possible test cases based on the NFTs currently being retrieved in the script.
        const totalGetNFTIDsTestCases = [];
        for (let match of getNFTIDsV1.matchAll(/ids\[\"(\w*)\"\]/g)) {
            let [full, key] = match;
            totalGetNFTIDsTestCases.push([key.trim()]);
        }
        // Grab all the test cases that are currently covered.
        const getNFTIDsContractToAddresses = {};
        for (let match of testGetNFTIDsScript.matchAll(
            /(\w*)\)\n.*\n.*flow scripts execute getNFTIDs.cdc(.*) --/g
        )) {
            let [full, key, value] = match;
            getNFTIDsContractToAddresses[key.trim()] = value.trim();
        }

        // Grab all possible test cases based on the NFTs currently being retrieved in the script.
        const totalGetNFTsTestCases = [];
        for (let match of getNFTsV1.matchAll(/case \"(\w*)\"/g)) {
            let [full, key] = match;
            totalGetNFTsTestCases.push([key.trim()]);
        }
        // Grab all the test cases that are currently covered.
        const getNFTsArgs = {};
        for (let match of testGetNFTsScript.matchAll(
            /(\w*)\)\n.*\n.*flow scripts execute getNFTs.cdc --args-json '(.*)' --network/g
        )) {
            let [full, key, value] = match;
            getNFTsArgs[key.trim()] = JSON.parse(value.trim());
        }

        beforeAll(async () => {
            const config = fcl.config();
            config.put(
                "accessNode.api",
                "https://access-mainnet-beta.onflow.org"
            );
        });

        describe("Metadata testing", () => {
            test.each(totalGetNFTIDsTestCases)(
                "Mainnet: getNFTIDs - Should be consistent between v1 and staging - %s",
                async (name) => {
                    const address = getNFTIDsContractToAddresses[name];
                    if (address === undefined) {
                        // Associated test was not implemented.  "Pass" the test for now until we improve coverage.
                        // console.warn(`${name} lacking test coverage.`);
                        return;
                    }
                    let errorV1,
                        errorStaging,
                        scriptResponseV1,
                        scriptResponseStaging;
                    try {
                        scriptResponseV1 = await fcl.decode(
                            await fcl.send([
                                fcl.script(getNFTIDsV1),
                                fcl.args([fcl.arg(address, Address)]),
                            ])
                        );
                    } catch (err) {
                        errorV1 = err.message
                            .match(/\[Error Code.*\](.*(\s*error: (.*))?)/m)[0]
                            .trim();
                    }
                    try {
                        scriptResponseStaging = await fcl.decode(
                            await fcl.send([
                                fcl.script(getNFTIDsStaging1),
                                fcl.args([fcl.arg(address, Address)]),
                            ])
                        );
                        scriptResponseStaging = {
                            ...scriptResponseStaging,
                            ...(await fcl.decode(
                                await fcl.send([
                                    fcl.script(getNFTIDsStaging2),
                                    fcl.args([fcl.arg(address, Address)]),
                                ])
                            )),
                        };
                        scriptResponseStaging = {
                            ...scriptResponseStaging,
                            ...(await fcl.decode(
                                await fcl.send([
                                    fcl.script(getNFTIDsStaging3),
                                    fcl.args([fcl.arg(address, Address)]),
                                ])
                            )),
                        };
                        scriptResponseStaging = {
                            ...scriptResponseStaging,
                            ...(await fcl.decode(
                                await fcl.send([
                                    fcl.script(getNFTIDsStaging4),
                                    fcl.args([fcl.arg(address, Address)]),
                                ])
                            )),
                        };
                    } catch (err) {
                        errorStaging = err.message
                            .match(/\[Error Code.*\](.*(\s*error: (.*))?)/m)[0]
                            .trim();
                    }
                    validate(
                        scriptResponseV1,
                        scriptResponseStaging,
                        errorV1,
                        errorStaging
                    );
                },
                10000
            );

            test.each(totalGetNFTsTestCases)(
                "Mainnet: getNFTs - Should be consistent between v1 and staging - %s",
                async (name) => {
                    const args = getNFTsArgs[name];
                    if (args === undefined) {
                        // Associated test was not implemented.  "Pass" the test for now until we improve coverage.
                        // console.warn(`${name} lacking test coverage.`);
                        return;
                    }
                    const fclArgs = fcl.args([
                        fcl.arg(args[0].value, Address),
                        fcl.arg(
                            args[1].value.map((raw) => {
                                return {
                                    key: raw.key.value,
                                    value: raw.value.value.map((rawValue) =>
                                        parseInt(rawValue.value)
                                    ),
                                };
                            }),
                            Dictionary({
                                key: tString,
                                value: tArray(UInt64),
                            })
                        ),
                    ]);
                    let errorV1,
                        errorStaging,
                        scriptResponseV1,
                        scriptResponseStaging;
                    try {
                        scriptResponseV1 = await fcl.decode(
                            await fcl.send([fcl.script(getNFTsV1), fclArgs])
                        );
                    } catch (err) {
                        errorV1 = err.message
                            .match(/\[Error Code.*\](.*(\s*error: (.*))?)/m)[0]
                            .trim();
                    }
                    try {
                        scriptResponseStaging = await fcl.decode(
                            await fcl.send([
                                fcl.script(getNFTsStaging1),
                                fclArgs,
                            ])
                        );
                        scriptResponseStaging = [
                            ...scriptResponseStaging,
                            ...(await fcl.decode(
                                await fcl.send([
                                    fcl.script(getNFTsStaging2),
                                    fclArgs,
                                ])
                            )),
                        ];
                        scriptResponseStaging = [
                            ...scriptResponseStaging,
                            ...(await fcl.decode(
                                await fcl.send([
                                    fcl.script(getNFTsStaging3),
                                    fclArgs,
                                ])
                            )),
                        ];
                        scriptResponseStaging = [
                            ...scriptResponseStaging,
                            ...(await fcl.decode(
                                await fcl.send([
                                    fcl.script(getNFTsStaging4),
                                    fclArgs,
                                ])
                            )),
                        ];
                    } catch (err) {
                        errorStaging = err.message
                            .match(/\[Error Code.*\](.*(\s*error: (.*))?)/m)[0]
                            .trim();
                    }
                    validate(
                        scriptResponseV1,
                        scriptResponseStaging,
                        errorV1,
                        errorStaging
                    );
                },
                10000
            );

            console.log(
                `Mainnet getNFTIDs Test Coverage: ${
                    (Object.keys(getNFTIDsContractToAddresses).length /
                        totalGetNFTIDsTestCases.length) *
                    100
                }%`
            );
            console.log(
                `Mainnet getNFTs Test Coverage: ${
                    (Object.keys(getNFTsArgs).length /
                        totalGetNFTsTestCases.length) *
                    100
                }%`
            );
        });
    });

export default cadenceTestingSuite;
