# Error Handling & Best Practices

## Gemini API Error Handling

### Common Error Scenarios

- **500 Internal Error**: Often caused by image complexity, format issues, or temporary service problems
- **400 Bad Request**: Invalid input, unsupported image format, or malformed request
- **429 Rate Limit**: Too many requests in a short time period
- **413 Payload Too Large**: Image file exceeds size limits

### Image Processing Guidelines

#### Supported Formats

- JPEG/JPG
- PNG
- WebP
- GIF

#### Size Limits

- Maximum file size: 20MB
- Minimum file size: 1KB (to avoid corrupted files)
- Recommended: Keep images under 10MB for better performance

#### Validation Steps

1. Check file type against supported formats
2. Validate file size within limits
3. Ensure file is not corrupted (minimum size check)
4. Convert to base64 with error handling
5. Add retry logic for rate limiting

### Error Recovery Strategies

#### For 500 Errors

- Suggest trying with a simpler/smaller image
- Recommend waiting and retrying
- Provide fallback demo content

#### For Rate Limiting (429)

- Implement exponential backoff
- Add delays between requests (minimum 500ms)
- Show user-friendly rate limit messages

#### For Invalid Input (400)

- Validate inputs before API calls
- Provide specific format requirements
- Guide users to correct formats

### User Experience

- Always provide clear, actionable error messages
- Show progress logs during generation
- Offer fallback options when possible
- Never show raw API error messages to users

### Debugging

- Log all API requests with relevant metadata
- Track file sizes, types, and processing steps
- Include retry counts and error details
- Monitor for patterns in failures
