import { Connection, getConnection } from 'typeorm';
import { PubSub } from '@google-cloud/pubsub';
import { FastifyInstance } from 'fastify';
import { mocked } from 'ts-jest/utils';

import appFunc from '../src';
import { mockMessage, saveFixtures } from './helpers';
import worker from '../src/workers/postUpvoteCanceledRep';
import { Post, Source, User } from '../src/entity';
import { sourcesFixture } from './fixture/source';
import { postsFixture } from './fixture/post';
import { notifyUserReputationUpdated } from '../src/common';

jest.mock('../src/common/pubsub', () => ({
  ...jest.requireActual('../src/common/pubsub'),
  notifyUserReputationUpdated: jest.fn(),
}));

let con: Connection;
let app: FastifyInstance;

beforeAll(async () => {
  con = await getConnection();
  app = await appFunc();
  return app.ready();
});

beforeEach(async () => {
  jest.resetAllMocks();
  await saveFixtures(con, Source, sourcesFixture);
  await saveFixtures(con, Post, postsFixture);
  await con.getRepository(User).save([
    {
      id: '1',
      name: 'Ido',
      image: 'https://daily.dev/ido.jpg',
      reputation: 3,
    },
  ]);
  await con.getRepository(Post).update('p1', { authorId: '1' });
});

it('should decrease reputation and notify', async () => {
  const message = mockMessage({
    userId: '2',
    postId: 'p1',
  });

  await worker.handler(message, con, app.log, new PubSub());
  expect(message.ack).toBeCalledTimes(1);
  const user = await con.getRepository(User).findOne('1');
  expect(user.reputation).toEqual(2);
  expect(mocked(notifyUserReputationUpdated).mock.calls[0].slice(1)).toEqual([
    '1',
    2,
  ]);
});

it('should not decrease reputation when the author is the upvote user', async () => {
  const message = mockMessage({
    userId: '1',
    postId: 'p1',
  });

  await worker.handler(message, con, app.log, new PubSub());
  expect(message.ack).toBeCalledTimes(1);
  const user = await con.getRepository(User).findOne('1');
  expect(user.reputation).toEqual(3);
  expect(notifyUserReputationUpdated).toBeCalledTimes(0);
});