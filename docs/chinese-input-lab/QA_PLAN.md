# QA plan

Automated gates:

```bash
npm run validate:chinese-input-data
npm run test:chinese-input
npm run qa:chinese-input
npm run qa:config-check
npm run qa:smoke
npm run build
```

Playwright covers direct routing/discovery, active-key subsets, physical and pointer input, repeated keys, specific wrong-order feedback, method-separated mastery, adaptive weak/due review, completion persistence, old-state migration, mobile overflow and keyboard focus.

Manual checks — record honestly before release:

- [ ] Chrome desktop visual/audio check
- [ ] Safari desktop
- [ ] physical keyboard on a real device
- [ ] iPhone-sized touch interaction
- [ ] Android-sized touch interaction
- [ ] Cantonese voice installed
- [ ] Cantonese voice unavailable
- [ ] 200% zoom
- [ ] screen-reader smoke
- [ ] offline/static deployment
- [ ] production direct refresh on `/chinese-input`
- [ ] mobile landscape
