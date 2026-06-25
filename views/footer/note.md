- auth service [x]
- file organisation [x]
- templates [x]

Warning: Ignoring extra certs from `/path/to/certificate.pem`, load failed: error:80000002:system library::No such file or directory
Warning: Ignoring extra certs from `/path/to/certificate.pem`, load failed: error:80000002:system library::No such file or directory
Warning: Ignoring extra certs from `/path/to/certificate.pem`, load failed: error:80000002:system library::No such file or directory

Alex to put into own notes:
```
export NODE_EXTRA_CA_CERTS=""
```


Failed to install browsers
Error: Failed to download Chrome for Testing 149.0.7827.55 (playwright chromium v1228), caused by
Error: Download failure, code=1
    at ChildProcess.<anonymous> (/Users/alexander.tanner/Projects/mcc_dev/laa-manage-your-civil-cases/node_modules/playwright-core/lib/coreBundle.js:27788:32)
    at ChildProcess.emit (node:events:509:20)
    at ChildProcess._handle.onexit (node:internal/child_process:294:12)