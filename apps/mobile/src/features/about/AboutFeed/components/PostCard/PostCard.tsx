import { assertUnreachable, type AboutPost } from '@safely/core';

import { ExternalLinkCard } from '../ExternalLinkCard';
import { TaggedText } from '../TaggedText';

interface PostCardProps {
    post: AboutPost;
}

export const PostCard = ({ post }: PostCardProps) => {
    switch (post.type) {
        case 'taggedTextPost':
            return <TaggedText taggedText={post.tagged_text} links={post.links} />;
        case 'externalLinkPost':
            return <ExternalLinkCard {...post} />;
        default:
            return assertUnreachable(post);
    }
};
