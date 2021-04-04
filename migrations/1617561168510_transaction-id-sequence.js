/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
  pgm.createSequence('transaction_id', {
    type: 'integer',
    increment: 1,
    start: 1
  });
};

exports.down = pgm => {
  pgm.dropSequence('transaction_id');
};
