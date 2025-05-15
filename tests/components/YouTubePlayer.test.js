import React from 'react';
import { expect } from 'chai';
import { render } from '@testing-library/react';
import YouTubePlayer from '../../app/components/YouTubePlayer.tsx';

describe('YouTubePlayer Component', () => {
  it('should render an iframe with the provided YouTube URL', () => {
    const videoUrl = 'https://www.youtube.com/watch?v=abcdef12345';
    
    const { getByTitle } = render(
      <YouTubePlayer 
        videoUrl={videoUrl} 
      />
    );
    
    const iframe = getByTitle('YouTube video player');
    expect(iframe).to.exist;
    expect(iframe.tagName).to.equal('IFRAME');
    expect(iframe.getAttribute('src')).to.include('youtube.com/embed/abcdef12345');
  });
  
  it('should render with default title', () => {
    const videoUrl = 'https://www.youtube.com/watch?v=abcdef12345';
    
    const { getByTitle } = render(
      <YouTubePlayer 
        videoUrl={videoUrl} 
      />
    );
    
    const iframe = getByTitle('YouTube video player');
    expect(iframe).to.exist;
  });
  
  it('should render with allow attributes for autoplay and fullscreen', () => {
    const videoUrl = 'https://www.youtube.com/watch?v=abcdef12345';
    
    const { getByTitle } = render(
      <YouTubePlayer 
        videoUrl={videoUrl} 
      />
    );
    
    const iframe = getByTitle('YouTube video player');
    const allowAttribute = iframe.getAttribute('allow');
    
    expect(allowAttribute).to.include('accelerometer');
    expect(allowAttribute).to.include('autoplay');
    expect(allowAttribute).to.include('clipboard-write');
    expect(allowAttribute).to.include('encrypted-media');
    expect(allowAttribute).to.include('gyroscope');
    expect(allowAttribute).to.include('picture-in-picture');
  });
  
  it('should render with allowFullScreen attribute', () => {
    const videoUrl = 'https://www.youtube.com/watch?v=abcdef12345';
    
    const { getByTitle } = render(
      <YouTubePlayer 
        videoUrl={videoUrl} 
      />
    );
    
    const iframe = getByTitle('YouTube video player');
    expect(iframe.getAttribute('allowFullScreen')).to.not.be.null;
  });
  
  it('should render with responsive container', () => {
    const videoUrl = 'https://www.youtube.com/watch?v=abcdef12345';
    
    const { container } = render(
      <YouTubePlayer 
        videoUrl={videoUrl} 
      />
    );
    
    // Check for responsive container
    const responsiveDiv = container.firstChild;
    expect(responsiveDiv.className).to.include('relative');
    expect(responsiveDiv.className).to.include('w-full');
    expect(responsiveDiv.getAttribute('style')).to.include('padding-bottom: 56.25%');
  });
  
  it('should render with responsive iframe', () => {
    const videoUrl = 'https://www.youtube.com/watch?v=abcdef12345';
    
    const { getByTitle } = render(
      <YouTubePlayer 
        videoUrl={videoUrl} 
      />
    );
    
    const iframe = getByTitle('YouTube video player');
    expect(iframe.className).to.include('absolute');
    expect(iframe.className).to.include('w-full');
    expect(iframe.className).to.include('h-full');
  });
  
  it('should handle different YouTube URL formats', () => {
    const videoUrl = 'https://youtu.be/abcdef12345';
    
    const { getByTitle } = render(
      <YouTubePlayer 
        videoUrl={videoUrl} 
      />
    );
    
    const iframe = getByTitle('YouTube video player');
    expect(iframe.getAttribute('src')).to.include('youtube.com/embed/abcdef12345');
  });
  
  it('should handle autoplay parameter', () => {
    const videoUrl = 'https://www.youtube.com/watch?v=abcdef12345';
    
    const { getByTitle } = render(
      <YouTubePlayer 
        videoUrl={videoUrl}
        autoplay={false}
      />
    );
    
    const iframe = getByTitle('YouTube video player');
    expect(iframe.getAttribute('src')).to.include('autoplay=0');
  });
});
