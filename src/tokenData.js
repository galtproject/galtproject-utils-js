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
const isObject = require('lodash/isObject');
const isUndefined = require('lodash/isUndefined');
const cyrillicToTranslitJs = new require('cyrillic-to-translit-js')();

module.exports = class TokenData {
  static get TOKEN_TYPE_BY_ID() {return {"0": "null", "1": "land", "2": "building", "3": "room"}};
  static get TOKEN_TYPE_BY_NAME() {return {ANY: "any", LAND: "land", BUILDING: "building", ROOM: "room"}};

  static getHumanAddressFromIpld(ipldData, tokenType = 'any', lang = 'en'){
    const resultObject = {};
    if(!ipldData) {
      return resultObject;
    }

    let humanAddressObject = ipldData.humanAddress;

    if(!humanAddressObject) {
      return {};
    }

    if(humanAddressObject.cityStreet || humanAddressObject.countryRegion) {
      let {countryRegion, cityStreet, floor, litera} = humanAddressObject;
      resultObject['country'] = (countryRegion || '').split(', ')[0] || '';
      resultObject['region'] = (countryRegion || '').split(', ')[1] || '';
      resultObject['city'] = '';
      resultObject['street'] = cityStreet;
      resultObject['floor'] = floor;
      resultObject['roomNumber'] = litera;

      return this.pickHumanAddressFields(resultObject, tokenType, lang);
    } else {
      return this.pickHumanAddressFields(humanAddressObject, tokenType, lang);
    }
  }

  static pickHumanAddressFields(humanAddressObject, tokenType = 'any', lang = 'en') {
    const resultObject = {};
    this.getFieldsList(tokenType).forEach(field => {
      if(isUndefined(humanAddressObject[field])) {
        return;
      }
      const value = humanAddressObject[field];
      resultObject[field] = isObject(value) && value.lang ? (value[lang] || value['en']) : value;
    });
    return resultObject;
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

  static generateHumanAddressContractString(humanAddressObject, tokenType = 'any', lang = 'en'){
    if(!humanAddressObject) {
      return '';
    }
    humanAddressObject = this.getHumanAddressFromIpld({
      humanAddress: humanAddressObject
    });
    humanAddressObject = this.pickHumanAddressFields(humanAddressObject, tokenType, lang);

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

  static translitTokenFields(tokenData, tokenType = 'any', langToTranslit = 'ru') {
    const resultTokenData = {};
    this.getFieldsList(tokenType).forEach(field => {
      const fieldValue = tokenData[field];
      if(isUndefined(fieldValue)) {
        return;
      }
      resultTokenData[field] = fieldValue;
      if(!isObject(fieldValue) || !fieldValue.lang) {
        return;
      }
      resultTokenData[field].en = cyrillicToTranslitJs.transform(fieldValue[langToTranslit]);
    });
    return resultTokenData;
  }
};
