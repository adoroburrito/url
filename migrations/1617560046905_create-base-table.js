/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
  pgm.createTable('urls', {
    id: 'id',
    slug: { type: 'varchar(15)', notNull: true },
    redirect: { type: 'varchar(1000)', notNull: true },
    createdAt: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp')
    },
    updatedAt: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp')
    },
    active: 'integer'
  });
};

exports.down = pgm => {
  pgm.dropTable('urls');
};
