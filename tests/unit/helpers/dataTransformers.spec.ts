/**
 * Data Transformer Tests
 *
 * Basic regression tests for data transformation functionality.
 * Covers creating a list of category items for selection.
 *
 * Testing Level: Unit (Helper Functions)
 * Component: Data Transformers
 * Dependencies: apiService
 */


import { describe, it, afterEach } from 'mocha';
import { expect } from 'chai';
import * as sinon from 'sinon';

import { buildCategoryItems } from '#src/scripts/helpers/dataTransformers.js';
import * as helpers from '#src/scripts/helpers/index.js';

describe('buildCategoryItems', () => {

  const choices = [
    { code: 'family', name: 'family' },
    { code: 'crime', name: 'crime' },
    { code: 'none', name: 'none name' }
  ];


  afterEach(() => {
    sinon.restore();
  });


  it('selects placeholder when no selectedCategory is provided', async () => {
    const result = await buildCategoryItems({
      choices,
      placeholderText: 'Select a category'
    });

    expect(result[0]).to.deep.equal({
      value: '',
      text: 'Select a category',
      selected: true
    });
  });

  it('selects the matching category', async () => {
    const result = await buildCategoryItems({
      choices,
      selectedCategory: 'crime',
      placeholderText: 'Select a category'
    });

    const selectedItem = result.find(item => item.value === 'crime');

    expect(selectedItem?.selected).to.be.true;
    expect(result[0].selected).to.be.false;
  });

  it('excludes the specified category code', async () => {
    const result = await buildCategoryItems({
      choices,
      placeholderText: 'Select a category',
      excludeCode: 'crime'
    });

    const values = result.map(item => item.value);

    expect(values).to.not.include('crime');
  });

  it('uses translated value when includeNone is true', async () => {
    const result = await buildCategoryItems({
      choices,
      placeholderText: 'Select a category'
    });

    const noneItem = result.find(item => item.value === 'none');


    expect(noneItem?.text).to.equal(
      helpers.capitaliseFirstLetter(
        helpers.t('allCategoriesAdditions.none')
      )
    );

  });

  it('uses original name when includeNone is false', async () => {
    const result = await buildCategoryItems({
      choices,
      placeholderText: 'Select a category'
    });

    const noneItem = result.find(item => item.value === 'none');


    expect(noneItem?.text).to.equal(
      helpers.capitaliseFirstLetter(
        helpers.t('allCategoriesAdditions.none')
      )
    );

  });
});
