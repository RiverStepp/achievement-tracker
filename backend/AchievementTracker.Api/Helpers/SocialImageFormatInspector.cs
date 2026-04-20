namespace AchievementTracker.Api.Helpers;

public static class SocialImageFormatInspector
{
     /// <summary>
     /// Detects image format from file content (magic bytes). Leaves the stream at position 0 when seekable.
     /// </summary>
     public static bool TryDetectImageMimeType(Stream stream, out string mimeType)
     {
          mimeType = string.Empty;
          if (!stream.CanRead)
               return false;

          long original = 0;
          if (stream.CanSeek)
               original = stream.Position;

          Span<byte> header = stackalloc byte[12];
          int read = 0;
          while (read < 12)
          {
               int n = stream.Read(header[read..12]);
               if (n == 0)
                    break;
               read += n;
          }
          if (stream.CanSeek)
               stream.Position = original;

          if (read < 3)
               return false;

          if (header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF)
          {
               mimeType = "image/jpeg";
               return true;
          }

          if (read >= 8
              && header[0] == 0x89
              && header[1] == 0x50
              && header[2] == 0x4E
              && header[3] == 0x47
              && header[4] == 0x0D
              && header[5] == 0x0A
              && header[6] == 0x1A
              && header[7] == 0x0A)
          {
               mimeType = "image/png";
               return true;
          }

          if (read >= 6
              && header[0] == (byte)'G'
              && header[1] == (byte)'I'
              && header[2] == (byte)'F'
              && header[3] == (byte)'8'
              && (header[4] == (byte)'7' || header[4] == (byte)'9')
              && header[5] == (byte)'a')
          {
               mimeType = "image/gif";
               return true;
          }

          if (read >= 12
              && header[0] == (byte)'R'
              && header[1] == (byte)'I'
              && header[2] == (byte)'F'
              && header[3] == (byte)'F'
              && header[8] == (byte)'W'
              && header[9] == (byte)'E'
              && header[10] == (byte)'B'
              && header[11] == (byte)'P')
          {
               mimeType = "image/webp";
               return true;
          }

          return false;
     }
}
