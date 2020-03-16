/*
 * Copyright ©️ 2019-2020 GaltProject Society Construction and Terraforming Company
 * (Founded by [Nikolai Popeka](https://github.com/npopeka)
 *
 * Copyright ©️ 2019-2020 Galt•Core Blockchain Company
 * (Founded by [Nikolai Popeka](https://github.com/npopeka) by
 * [Basic Agreement](ipfs/QmaCiXUmSrP16Gz8Jdzq6AJESY1EAANmmwha15uR3c1bsS)).
 */

const map = require('lodash/map');
const orderBy = require('lodash/orderBy');
const trim = require('lodash/trim');
const pick = require('lodash/pick');

module.exports = class TokenData {
  static get TOKEN_TYPE_BY_ID() {return {"0": "null", "1": "land", "2": "building", "3": "room"}};
  static get TOKEN_TYPE_BY_NAME() {return {ANY: "any", LAND: "land", BUILDING: "building", ROOM: "room"}};

  static getHumanAddressFromIpld(ipldData, tokenType = 'any'){
    const resultObject = {};
    if(!ipldData) {
      return resultObject;
    }

    const humanAddressObject = ipldData.humanAddress || {};

    if(!ipldData.protocolVersion || ipldData.protocolVersion < 2) {
      let {countryRegion, cityStreet, floor, litera} = humanAddressObject;
      //
      resultObject['country'] = (countryRegion || '').split(', ')[0] || '';
      resultObject['region'] = (countryRegion || '').split(', ')[1] || '';
      resultObject['city'] = '';
      resultObject['street'] = cityStreet;
      resultObject['floor'] = floor;
      resultObject['roomNumber'] = litera;

      return pick(resultObject, TokenData.getFieldsList(tokenType));
    } else {
      return pick(humanAddressObject, TokenData.getFieldsList(tokenType));
    }
  }

  static getHumanAddressFromContractString(contractString, tokenType = 'any'){
    const resultObject = {};
    if(!contractString) {
      return resultObject;
    }

    const humanAddressFieldToObjectField = {
      'floor': 'floor',
      'litera': 'roomNumber',
      'cn': 'country',
      'rg': 'region',
      'ct': 'city',
      'sr': 'street',
      'pn': 'plotNumber',
      'bn': 'buildingNumber',
      'fl': 'floor',
      'rn': 'roomNumber',
      'sh': 'share',
      'ts': 'totalShares'
    };

    contractString.split('|\n').forEach(fieldValue => {
      let field = fieldValue.split('=')[0];
      let value = fieldValue.split('=')[1];
      if(field === 'countryRegion') {
        resultObject['country'] = (value || '').split(', ')[0] || '';
        resultObject['region'] = (value || '').split(', ')[1] || '';
      }
      if(field === 'cityStreet') {
        resultObject['city'] = '';
        resultObject['street'] = value;
      }
      if(humanAddressFieldToObjectField[field]) {
        resultObject[humanAddressFieldToObjectField[field]] = value;
      }
    });

    return pick(resultObject, TokenData.getFieldsList(tokenType));
  }

  static generateHumanAddressContractString(humanAddressObject, tokenType = 'any'){
    if(!humanAddressObject) {
      return '';
    }

    humanAddressObject = pick(humanAddressObject, TokenData.getFieldsList(tokenType));

    const humanAddressFieldToObjectField = {
      floor: 'fl',
      roomNumber: 'rn',
      country: 'cn',
      region: 'rg',
      city: 'ct',
      street: 'sr',
      plotNumber: 'pn',
      buildingNumber: 'bn',
      share: 'sh',
      totalShares: 'ts'
    };

    let arr = map(humanAddressFieldToObjectField, (contractField, objField) => ({name: contractField, value: trim(humanAddressObject[objField])}));

    return orderBy(arr, ['name'], ['asc'])
      .filter((obj) => !!obj.value)
      .map(obj => obj.name + '=' + obj.value)
      .join('|\n');
  }

  static getFieldsList(tokenType = 'any') {
    tokenType = TokenData.TOKEN_TYPE_BY_ID[tokenType] || tokenType;

    return ({
      'land': ['country', 'region', 'city', 'street', 'plotNumber', 'share', 'totalShares'],
      'building': ['country', 'region', 'city', 'street', 'buildingNumber', 'share', 'totalShares'],
      'room': ['country', 'region', 'city', 'street', 'buildingNumber', 'floor', 'roomNumber', 'share', 'totalShares'],
      'any': ['country', 'region', 'city', 'street', 'plotNumber', 'buildingNumber', 'floor', 'roomNumber', 'share', 'totalShares']
    })[tokenType] || [];
  }
};
