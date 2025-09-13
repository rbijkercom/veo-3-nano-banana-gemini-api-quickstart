import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

interface Comment {
  id: number;
  author: string;
  content: string;
  timestamp: string;
  rating: number;
}

export function CommentSection() {
  const [comments] = useState<Comment[]>([
    {
      id: 1,
      author: 'Sarah M.',
      content:
        'The brand identity is clear but could use more visual hierarchy. The services offered are somewhat obvious from the design.',
      timestamp: '2 hours ago',
      rating: 4,
    },
    {
      id: 2,
      author: 'Mike R.',
      content:
        'I immediately understood this was a digital marketing company. The layout is professional and the messaging is on point.',
      timestamp: '5 hours ago',
      rating: 5,
    },
    {
      id: 3,
      author: 'Jessica L.',
      content:
        'Good overall design but the call-to-action could be more prominent. It took me a moment to understand the full service offering.',
      timestamp: '1 day ago',
      rating: 3,
    },
  ]);

  const [newComment, setNewComment] = useState('');

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    // In a real app, this would submit to an API
    console.log('New comment:', newComment);
    setNewComment('');
  };

  return (
    <div className="space-y-6">
      {/* Add Comment Form */}
      <form onSubmit={handleSubmitComment} className="space-y-4">
        <Input
          placeholder="Share your thoughts on this brand identity showcase..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="w-full"
        />
        <Button type="submit" disabled={!newComment.trim()}>
          Add Comment
        </Button>
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.map((comment) => (
          <Card key={comment.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{comment.author}</span>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, index) => (
                      <span
                        key={index}
                        className={`text-sm ${
                          index < comment.rating
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">
                  {comment.timestamp}
                </span>
              </div>
              <p className="text-sm">{comment.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
