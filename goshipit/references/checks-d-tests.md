# Category D — Tests

| ID  | Check                                                                                                                        | P            |
| --- | ---------------------------------------------------------------------------------------------------------------------------- | ------------ |
| D1  | Run `test_command` from Stack Profile — report X passed / Y failed                                                           | P0 (if fail) |
| D2  | Test coverage includes: auth flow, form submission, payment (if applicable), API error states                                | P1           |
| D3  | `it.skip`, `xit`, `pytest.mark.skip` in critical path tests                                                                  | P1           |
| D4  | No E2E framework (Playwright, Cypress, Puppeteer, Selenium) in deps — flag for apps with auth, checkout, or multi-step flows | P1           |
