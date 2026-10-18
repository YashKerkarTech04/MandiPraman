Friction report: building on Arkiv (Tiramisu, SDK 0.8.1)

Environment: @arkiv-network/sdk 0.8.1 (pinned in backend/package-lock.json), viem 2.57, Tiramisu testnet, Windows 11 + Node 22. Every entry below can be reproduced with npm run probe in backend/ (see backend/scripts/friction-probe.ts) unless it says otherwise.

1. ne() and exists() are exported and compile, but the node rejects them with a message that does not name the problem
What I tried: Used ne("typed_text", str("nope")) and exists("typed_text") next to a normal eq("project", ...) filter.
Expected: Either a compile/client-side error saying the operator is unsupported, or a node message that names it.
Actual (exact text): QueryError kind=type code=-32002: Query rejected (type, -32002): Requested resource not available.. Query: project = str('mandi_board_v1_probe') AND typed_text != str('nope') and the same with ... AND EXISTS(typed_text).
Why it is friction: The Querying data page does say these two are not supported yet, but the SDK still exports them with no type error. At runtime, "Requested resource not available" reads like a permission or rate-limit problem, not "this operator does not exist". The docs define kind: "type" as "an operator the node does not support for that type", which is a narrower meaning than "the whole operator is unsupported". The SDK also exports UnsupportedOperatorError, but it is not raised here.
Steps: npm run probe, section [2].
Suggestion: Throw UnsupportedOperatorError in the SDK while the network lacks the operators, or make the node say "operator != is not supported". Fix the double period (..).
2. A type mismatch silently returns zero rows, and the default type of a bare value is not documented
What I tried: Stored one entity with a bare string, a bare integer 5, and a typed str, then queried the bare integer with four different constructors.
Actual: Stored types were {"bare_num":"i32","bare_text":"str","project":"str","typed_text":"str"}. Result counts: str('hello') found 1, bare 'hello' found 1, i32(5) found 1, u64(5n) found 0, dec('5') found 0, str('5') found 0. None of the zero-row queries gave an error or a warning.
Why it is friction: The docs do say a mismatch "is not an error: the query runs and returns nothing", so this is documented behaviour. The pain is that a developer cannot tell "no data" from "wrong type", and the page never states the mapping for bare values. I only learned that a bare 5 becomes i32 (and a bare string becomes str) by running the experiment. A bare Date.now() would not fit i32, and the docs elsewhere say timestamps belong in u64.
Steps: npm run probe, section [1].
Suggestion: Document the bare-value mapping in Mutating data. Consider an opt-in debug mode that reports "attribute bare_num exists with type i32, but you queried u64", since the node already knows the attribute schema.
3. Error text for an uppercase attribute name contradicts the docs, and it is reported as a failed transaction
What I tried: createEntity with an attribute named Bad_Name.
Actual (exact text): EntityMutationError: Transaction failed: an attribute name holds "B" (0x42) at byte 0, which is outside the name charset ("A"-"Z", "a"-"z", "0"-"9", ".", "-" and "_", with a letter first)
Why it is friction: The message lists "A"-"Z" as part of the allowed charset and then rejects "B". Mutating data says names must be lowercase ("Uppercase letters are rejected"). So the message points the wrong way. It also arrives as EntityMutationError: Transaction failed, even though the SDK exports isValidAttributeName, validateAttributeName and InvalidAttributeNameError; the other input checks I tried (long str, odd expiry, float to i32) were all caught on the client before sending.
Steps: npm run probe, section [4], first item.
Suggestion: Correct the message to say lowercase only, and call validateAttributeName inside createEntity so this fails before a transaction is sent.
4. A snippet on the React Integration page does not typecheck
What I tried: Copied lib/arkiv-queries.ts from the React Integration page into a TypeScript project (SDK 0.8.1) and ran tsc --noEmit --strict.
Actual: One error, at fetchEntityByKey: error TS2345: Argument of type 'string' is not assignable to parameter of type '0x${string}'. The snippet declares entityKey: string and passes it to publicClient.getEntity(entityKey), which takes a hex key.
Notes: Everything else on that page compiled, including the bare string attribute values (project: "my-app") and eq(PROJECT_ATTRIBUTE.key, PROJECT_ATTRIBUTE.value). This check was done by typechecking only, not by running the snippet in a browser.
Suggestion: Change the parameter type to `0x${string}` (or Hex from viem).
5. The "Copy Markdown" button leaves unrendered component tags in the copied text
What I tried: Clicked Copy Markdown on three SDK pages and pasted the result into a file.
Actual: The raw tags <NetworkNote /> and <RpcTerms /> appear in the text: Mutating data lines 3 and 26, Querying data lines 3 and 24, React Integration line 3.
Why it is friction: The button exists so the page can be pasted into an AI assistant or notes. The tags carry no text there, and the network note and terms they stand for are missing.
Steps: Open docs.arkiv.network/typescript-sdk/mutating-data/, click Copy Markdown, paste.
Suggestion: Expand those components into their text when copying.
What worked well (specific)
Setup was quick: MetaMask accepted the Tiramisu network, and the faucet paid out test GLM on the first try.
Most client-side errors tell you the fix, for example: 200 UTF-8 bytes exceeds the 128-byte limit on a str. Store the long form in the entity payload and keep a short, queryable key here., a lifetime must be a multiple of the 2s block time, got 7, which is 3.5 blocks. Try 6 or 8, and Use dec("1.5") for a fixed-point decimal.
The no-filter query error explains why and what to do: A query needs at least one filter ... Add a where(...) predicate, or narrow by ownedBy(...) / createdBy(...).
The readonly flag works and its error is clear: entity ... was created readonly, so its contents can never change. Its expiry can still be extended, and it can be transferred or deleted (see npm run prove-readonly).
executeBatch handled 20 creates per transaction without trouble (see backend/scripts/seed.ts).