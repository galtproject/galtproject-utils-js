const utm = require('../src/utm');
const assert = require('assert');

describe('latLon utils', () => {
    it('should correctly convert latLon to utm', function () {
        const latLonToCheck = [
            [-74.0550677213, -90.318972094],
            [25.5888986977, -125.9639064827],
            [11.9419456134, 30.6196556841],
            [66.9375384427, -9.6290061374],
            [-1.9773564645, 134.3986143967]
        ];

        const shouldBeUtmByIndex = [
            { zone: 15, h: 'S', x: 582184.914156, y: 1779969.098105, convergence: -2.578020654, scale: 0.99968257906 },
            { zone: 10, h: 'N', x: 202270.551102, y: 2833486.274605, convergence: -1.281088775, scale: 1.000694737455 },
            { zone: 36, h: 'N', x: 240753.909523, y: 1321248.884905, convergence: -0.492818697, scale: 1.000431591336 },
            { zone: 29, h: 'N', x: 472503.837058, y: 7424555.961089, convergence: -0.578738506, scale: 0.999609252979 },
            { zone: 53, h: 'S', x: 433119.186937, y: 9781429.716413, convergence: 0.020751304, scale: 0.999655369864 }
        ];

        latLonToCheck.forEach((latLon, index) => {
            const resultUtm = utm.fromLatLon(latLon[0], latLon[1]);

            assert.equal(shouldBeUtmByIndex[index].zone, resultUtm.zone);
            assert.equal(shouldBeUtmByIndex[index].h, resultUtm.h);
            assert.equal(shouldBeUtmByIndex[index].x, resultUtm.x);
            assert.equal(shouldBeUtmByIndex[index].y, resultUtm.y);
            assert.equal(shouldBeUtmByIndex[index].scale, resultUtm.scale);
            assert.equal(shouldBeUtmByIndex[index].convergence, resultUtm.convergence);
        });
    });
});
