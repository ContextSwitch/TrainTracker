import { expect } from 'chai';
import { getStationByName, getYoutubeEmbedUrl } from '../../app/config';

describe('Config Utility Functions', () => {
  describe('getStationByName', () => {
    it('should find a station by exact name match', () => {
      const station = getStationByName('Gallup');
      
      expect(station).to.not.be.undefined;
      expect(station?.name).to.equal('Gallup');
      expect(station?.youtubeLink).to.include('youtube.com');
    });
    
    it('should find a station by case-insensitive exact match', () => {
      const station = getStationByName('gallup');
      
      expect(station).to.not.be.undefined;
      expect(station?.name).to.equal('Gallup');
    });
    
    it('should find a station by partial match in station name', () => {
      const station = getStationByName('Vegas');
      
      expect(station).to.not.be.undefined;
      expect(station?.name).to.equal('Las Vegas');
    });
    
    it('should find a station when search term includes station name', () => {
      const station = getStationByName('Near Gallup Station');
      
      expect(station).to.not.be.undefined;
      expect(station?.name).to.equal('Gallup');
    });
    
    it('should return undefined when no match is found', () => {
      const station = getStationByName('NonExistentStation');
      
      expect(station).to.be.undefined;
    });
  });
  
  describe('getYoutubeEmbedUrl', () => {
    it('should convert a YouTube watch URL to embed URL', () => {
      const watchUrl = 'https://www.youtube.com/watch?v=abcdef12345';
      const embedUrl = getYoutubeEmbedUrl(watchUrl);
      
      expect(embedUrl).to.equal('https://www.youtube.com/embed/abcdef12345?autoplay=1');
    });
    
    it('should convert a YouTube live URL to embed URL', () => {
      const liveUrl = 'https://www.youtube.com/live/abcdef12345';
      const embedUrl = getYoutubeEmbedUrl(liveUrl);
      
      expect(embedUrl).to.equal('https://www.youtube.com/embed/abcdef12345?autoplay=1');
    });
    
    it('should return the original URL for railstream.net URLs', () => {
      const railstreamUrl = 'https://railstream.net/live-cameras/item/fullerton-guest';
      const embedUrl = getYoutubeEmbedUrl(railstreamUrl);
      
      expect(embedUrl).to.equal(railstreamUrl);
    });
    
    it('should return the original URL for unrecognized formats', () => {
      const unknownUrl = 'https://example.com/video/12345';
      const embedUrl = getYoutubeEmbedUrl(unknownUrl);
      
      expect(embedUrl).to.equal(unknownUrl);
    });
  });
});
