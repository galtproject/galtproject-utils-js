/*
 * Copyright ©️ 2019 GaltProject Society Construction and Terraforming Company
 * (Founded by [Nikolai Popeka](https://github.com/npopeka)
 *
 * Copyright ©️ 2019 Galt•Core Blockchain Company
 * (Founded by [Nikolai Popeka](https://github.com/npopeka) by
 * [Basic Agreement](ipfs/QmaCiXUmSrP16Gz8Jdzq6AJESY1EAANmmwha15uR3c1bsS)).
 */

/**
 * Pure geohash operations based on symbols relations in geohash concept, without using any libs.
 */
module.exports = class Geohash {
    static get neighbourData() {
        return {
            n: ['p0r21436x8zb9dcf5h7kjnmqesgutwvy', 'bc01fg45238967deuvhjyznpkmstqrwx'],
            s: ['14365h7k9dcfesgujnmqp0r2twvyx8zb', '238967debc01fg45kmstqrwxuvhjyznp'],
            e: ['bc01fg45238967deuvhjyznpkmstqrwx', 'p0r21436x8zb9dcf5h7kjnmqesgutwvy'],
            w: ['238967debc01fg45kmstqrwxuvhjyznp', '14365h7k9dcfesgujnmqp0r2twvyx8zb'],
        };
    }

    static get borderData() {
        return {
            n: ['prxz', 'bcfguvyz'],
            s: ['028b', '0145hjnp'],
            e: ['bcfguvyz', 'prxz'],
            w: ['0145hjnp', '028b'],
        };
    }

    static get base32() {
        return '0123456789bcdefghjkmnpqrstuvwxyz';
    }

    /**
     * Get neighbour geohash by given direction.
     *
     * @param   geohash - Cell to which adjacent cell is required.
     * @param   direction - Direction from geohash (n/s/e/w).
     * @returns {string} Geohash of neighbour.
     */
    static neighbourByDirection(geohash, direction) {
        const lastCh = geohash.slice(-1);    // last character of hash
        let parent = Geohash.getParent(geohash);

        const type = geohash.length % 2;

        // check for edge-cases which don't share common prefix
        if (this.borderData[direction][type].indexOf(lastCh) !== -1 && parent !== '') {
            parent = Geohash.neighbourByDirection(parent, direction);
        }

        // append letter for direction to parent
        return parent + Geohash.base32.charAt(this.neighbourData[direction][type].indexOf(lastCh));
    }

    /**
     * Returns all 8 neighbours geohashes by specified geohash.
     *
     * @param   {string} geohash - Geohash neighbours are required of.
     * @returns [n,ne,e,se,s,sw,w,nw]
     * @throws  Invalid geohash.
     */
    static allNeighbours(geohash) {
        return [
            Geohash.neighbourByDirection(geohash, 'n'),
            Geohash.neighbourByDirection(Geohash.neighbourByDirection(geohash, 'n'), 'e'),
            Geohash.neighbourByDirection(geohash, 'e'),
            Geohash.neighbourByDirection(Geohash.neighbourByDirection(geohash, 's'), 'e'),
            Geohash.neighbourByDirection(geohash, 's'),
            Geohash.neighbourByDirection(Geohash.neighbourByDirection(geohash, 's'), 'w'),
            Geohash.neighbourByDirection(geohash, 'w'),
            Geohash.neighbourByDirection(Geohash.neighbourByDirection(geohash, 'n'), 'w'),
        ];
    }

    /**
     * Get direction between geohash and neighbour
     * 
     * @param geohash
     * @param neighbour
     * @returns {*}
     */
    static directionOfNeighbour(geohash, neighbour) {
        if (geohash.length > neighbour.length) {
            geohash = geohash.slice(0, neighbour.length);
        } else if (neighbour.length > geohash.length) {
            neighbour = neighbour.slice(0, geohash.length);
        }

        const neighbours = Geohash.allNeighbours(geohash);

        if (neighbours.indexOf(neighbour) === -1) {
            return null;
        }

        return ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'][neighbours.indexOf(neighbour)];
    }

    static isNeighbourOnSameLevel(geohash, neighbour, direction) {
        if (direction.length === 1) {
            return neighbour === Geohash.neighbourByDirection(geohash, direction);
        } else {
            return neighbour === Geohash.neighbourByDirection(Geohash.neighbourByDirection(geohash, direction[0]), direction[1]);
        }
    }

    /**
     * Get neighbour on diff precision levels, for example: "u40" and "u410" with direction "e".
     * WARNING: Supports only 1 precision diff in levels.
     * 
     * @param geohash
     * @param neighbour
     * @param direction
     * @returns {boolean}
     */
    static isNeighbourOnDiffLevel(geohash, neighbour, direction) {
        const lengthDiff = geohash.length - neighbour.length;
        if (Math.abs(lengthDiff) > 1) {
            return false;
        }

        let highLevelGeohash;
        let lowLevelGeohash;

        if (lengthDiff < 0) {
            highLevelGeohash = geohash;
            lowLevelGeohash = neighbour;
        } else {
            lowLevelGeohash = geohash;
            highLevelGeohash = neighbour;
        }

        const lowLevelGeohashParent = Geohash.getParent(lowLevelGeohash);

        let isParentsNeighbours;
        if (lengthDiff < 0) {
            isParentsNeighbours = Geohash.isNeighbourOnSameLevel(highLevelGeohash, lowLevelGeohashParent, direction);
        } else {
            isParentsNeighbours = Geohash.isNeighbourOnSameLevel(lowLevelGeohashParent, highLevelGeohash, direction);
        }

        if (!isParentsNeighbours) {
            return false;
        }

        const lowLevelGeohashBorder = Geohash.getGeohashBorder(lowLevelGeohash);
        if (!lowLevelGeohashBorder) {
            return false;
        }

        const lowLevelGeohashDirection = Geohash.getGeohashBorder(lowLevelGeohash);

        if (lengthDiff > 0) {
            direction = Geohash.oppositeDirection(direction);
        }

        if (direction === 'e' && Geohash.isBorderWest(lowLevelGeohashDirection)) {
            return true;
        }
        if (direction === 'w' && Geohash.isBorderEast(lowLevelGeohashDirection)) {
            return true;
        }
        if (direction === 'n' && Geohash.isBorderSouth(lowLevelGeohashDirection)) {
            return true;
        }
        if (direction === 's' && Geohash.isBorderNorth(lowLevelGeohashDirection)) {
            return true;
        }

        return false;
    }

    static getGeohashBorder(geohash) {
        const type = geohash.length % 2;
        const lastChar = geohash.slice(geohash.length - 1);

        const isNBorder = Geohash.isBorder('n', type, lastChar);
        const isSBorder = Geohash.isBorder('s', type, lastChar);
        const isEBorder = Geohash.isBorder('e', type, lastChar);
        const isWBorder = Geohash.isBorder('w', type, lastChar);

        if (isSBorder && isWBorder) {
            return 'sw';
        }
        if (isNBorder && isWBorder) {
            return 'nw';
        }
        if (isSBorder && isEBorder) {
            return 'se';
        }
        if (isNBorder && isEBorder) {
            return 'ne';
        }
        if (isNBorder) {
            return 'n';
        }
        if (isSBorder) {
            return 's';
        }
        if (isEBorder) {
            return 'e';
        }
        if (isWBorder) {
            return 'w';
        }

        return null;
    }

    static isBorder(direction, type, lastChar) {
        return this.borderData[direction][type].indexOf(lastChar) !== -1;
    }

    static oppositeDirection(direction) {
        if (direction === 'n') {
            return 's';
        }
        if (direction === 's') {
            return 'n';
        }
        if (direction === 'w') {
            return 'e';
        }
        if (direction === 'e') {
            return 'w';
        }
        return null;
    }

    static isBorderEast(border) {
        return border === 'e' || border.slice(-1) === 'e';
    }

    static isBorderWest(border) {
        return border === 'w' || border.slice(-1) === 'w';
    }

    static isBorderNorth(border) {
        return border === 'n' || border.slice(0, -1) === 'n';
    }

    static isBorderSouth(border) {
        return border === 's' || border.slice(0, -1) === 's';
    }

    static getParent(geohash) {
        return geohash.slice(0, -1); // hash without last character
    }

    /**
     * Get full list of children geohashes by parent geohash
     * 
     * @param parentGeohash
     * @returns {Array}
     */
    static getChildren(parentGeohash) {
        let indexOfChildSymbol = 0;
        const childrenGeohashes = [];
        while (indexOfChildSymbol < 32) {
            childrenGeohashes.push(parentGeohash + Geohash.base32[indexOfChildSymbol]);
            indexOfChildSymbol++;
        }
        return childrenGeohashes;
    }

    /**
     * Get children list by one-side direction. 
     * For example: "gfp" have ["gfp0", "gfp1", "gfp4", "gfp5", "gfph", "gfpj", "gfpn", "gfpp"] children on "w" direction
     * @param geohash
     * @param direction
     * @returns {*}
     */
    static getChildrenByDirection(geohash, direction) {
        if (direction.length !== 1) {
            return null;
        }

        const type = (geohash.length + 1) % 2;

        const firstDirectionSymbols = Geohash.borderData[direction][type].split('');
        return firstDirectionSymbols.map((symbol) => {
            return geohash + symbol;
        });
    }

    /**
     * Get child by two-sides direction. For example: "gfp" have "gfp0" child on "sw" direction 
     * @param geohash
     * @param direction
     * @returns {*}
     */
    static getChildByDirection(geohash, direction) {
        if (direction.length !== 2 || !geohash) {
            return null;
        }

        const firstDirection = direction[0];
        const secondDirection = direction[1];

        const type = (geohash.length + 1) % 2;

        const firstDirectionSymbols = Geohash.borderData[firstDirection][type].split('');
        const secondDirectionSymbols = Geohash.borderData[secondDirection][type].split('');

        let resultSymbol;
        firstDirectionSymbols.some((fdSymbol) => {
            const intersection = secondDirectionSymbols.indexOf(fdSymbol) !== -1;
            if(intersection) {
                resultSymbol = fdSymbol;
            }
            return intersection;
        });
        if(!resultSymbol) {
            return null;
        }
        return geohash + resultSymbol;
    }

    /**
     * Get list of possible parents for merge from children geohashes. 
     * If all 32 children of parent exists - parent will be in list.
     * 
     * @param geohashesList
     * @returns {Array}
     */
    static getFullParentsFromGeohashList(geohashesList) {
        const parentsForMerge = [];
        const parentsToChildren = {};

        geohashesList.forEach((geohash, index) => {
            const parent = Geohash.getParent(geohash);
            if (!parentsToChildren[parent]) {
                parentsToChildren[parent] = [];
            }
            parentsToChildren[parent].push(geohash);

            if (parentsToChildren[parent].length === 32) {
                parentsForMerge.push(parent);
            }
        });

        return parentsForMerge;
    }

    /**
     * Get first neighbour with direction from possibleNeighbours list
     * 
     * @param geohash
     * @param possibleNeighbours
     * @param directionRequired
     * @returns {{geohash: *, direction: *}}
     */
    static getNeighbourWithDirection(geohash, possibleNeighbours, directionRequired) {
        let resultGeohash;
        let resultDirection;

        possibleNeighbours
            .some(possibleNeighbour => {
                if (geohash === possibleNeighbours) {
                    return false;
                }

                const direction = Geohash.directionOfNeighbour(geohash, possibleNeighbour);
                if (!direction || (directionRequired && direction !== directionRequired)) {
                    return false;
                }

                let isNeighbour;
                if (geohash.length === possibleNeighbour.length) {
                    isNeighbour = Geohash.isNeighbourOnSameLevel(geohash, possibleNeighbour, direction);
                } else {
                    isNeighbour = Geohash.isNeighbourOnDiffLevel(geohash, possibleNeighbour, direction);
                }
                if (isNeighbour) {
                    resultGeohash = possibleNeighbour;
                    resultDirection = direction;
                }
                return isNeighbour;
            });

        return {
            geohash: resultGeohash,
            direction: resultDirection
        };
    }
};
