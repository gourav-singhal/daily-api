import { PubSub, Topic } from '@google-cloud/pubsub';
import { Logger } from 'fastify';
import { SourceRequest } from '../entity';
import { toLegacySourceRequest } from '../compatibility/entity';

const pubsub = new PubSub();
const sourceRequestTopic = pubsub.topic('pub-request');
const postUpvotedTopic = pubsub.topic('post-upvoted');
const postUpvoteCanceledTopic = pubsub.topic('post-upvote-canceled');
const commentUpvotedTopic = pubsub.topic('comment-upvoted');
const postCommentedTopic = pubsub.topic('post-commented');
const commentCommentedTopic = pubsub.topic('comment-commented');
const commentFeaturedTopic = pubsub.topic('comment-featured');
const userReputationUpdatedTopic = pubsub.topic('user-reputation-updated');
const commentUpvoteCanceledTopic = pubsub.topic('comment-upvote-canceled');
const postAuthorMatchedTopic = pubsub.topic('post-author-matched');
const sendAnalyticsReportTopic = pubsub.topic('send-analytics-report');
const postReachedViewsThreshold = pubsub.topic('post-reached-views-threshold');

type NotificationReason = 'new' | 'publish' | 'approve' | 'decline';
// Need to support console as well
export type EventLogger = Omit<Logger, 'fatal'>;

const publishEvent = async (
  log: EventLogger,
  topic: Topic,
  payload: Record<string, unknown>,
): Promise<void> => {
  if (process.env.NODE_ENV === 'production') {
    try {
      await topic.publishJSON(payload);
    } catch (err) {
      log.error(
        { err, topic: topic.name, payload },
        'failed to publish message',
      );
    }
  }
};

export const notifySourceRequest = async (
  log: EventLogger,
  reason: NotificationReason,
  sourceReq: SourceRequest,
): Promise<void> =>
  publishEvent(log, sourceRequestTopic, {
    type: reason,
    pubRequest: toLegacySourceRequest(sourceReq),
  });

export const notifyPostUpvoted = async (
  log: EventLogger,
  postId: string,
  userId: string,
): Promise<void> =>
  publishEvent(log, postUpvotedTopic, {
    postId,
    userId,
  });

export const notifyPostUpvoteCanceled = async (
  log: EventLogger,
  postId: string,
  userId: string,
): Promise<void> =>
  publishEvent(log, postUpvoteCanceledTopic, {
    postId,
    userId,
  });

export const notifyCommentUpvoted = async (
  log: EventLogger,
  commentId: string,
  userId: string,
): Promise<void> =>
  publishEvent(log, commentUpvotedTopic, {
    commentId,
    userId,
  });

export const notifyPostCommented = async (
  log: EventLogger,
  postId: string,
  userId: string,
  commentId: string,
): Promise<void> =>
  publishEvent(log, postCommentedTopic, {
    postId,
    userId,
    commentId,
  });

export const notifyCommentCommented = async (
  log: EventLogger,
  postId: string,
  userId: string,
  parentCommentId: string,
  childCommentId: string,
): Promise<void> =>
  publishEvent(log, commentCommentedTopic, {
    postId,
    userId,
    parentCommentId,
    childCommentId,
  });

export const notifyCommentFeatured = async (
  log: EventLogger,
  commentId: string,
): Promise<void> =>
  publishEvent(log, commentFeaturedTopic, {
    commentId,
  });

export const notifyUserReputationUpdated = async (
  log: EventLogger,
  userId: string,
  reputation: number,
): Promise<void> =>
  publishEvent(log, userReputationUpdatedTopic, {
    userId,
    reputation,
  });

export const notifyCommentUpvoteCanceled = async (
  log: EventLogger,
  commentId: string,
  userId: string,
): Promise<void> =>
  publishEvent(log, commentUpvoteCanceledTopic, {
    commentId,
    userId,
  });

export const notifyPostAuthorMatched = async (
  log: EventLogger,
  postId: string,
  authorId: string,
): Promise<void> =>
  publishEvent(log, postAuthorMatchedTopic, {
    postId,
    authorId,
  });

export const notifySendAnalyticsReport = async (
  log: EventLogger,
  postId: string,
): Promise<void> =>
  publishEvent(log, sendAnalyticsReportTopic, {
    postId,
  });

export const notifyPostReachedViewsThreshold = async (
  log: EventLogger,
  postId: string,
  threshold: number,
): Promise<void> =>
  publishEvent(log, postReachedViewsThreshold, {
    postId,
    threshold,
  });
