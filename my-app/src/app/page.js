'use client';

import { useState, useEffect } from 'react';
import styles from "./page.module.css";

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 위치 정보 가져오기
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  };

  // 주소 정보 가져오기 (역지오코딩)
  const getAddressFromCoords = async (lat, lng) => {
    try {
      // OpenStreetMap Nominatim API 사용 (무료)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch (error) {
      console.error('Address lookup failed:', error);
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  };

  // 글 작성 시 위치 정보 자동 가져오기
  useEffect(() => {
    if (title || content) {
      setIsLoading(true);
      setLocationError('');
      
      getCurrentLocation()
        .then(async (coords) => {
          const address = await getAddressFromCoords(coords.latitude, coords.longitude);
          setLocation({
            ...coords,
            address
          });
          setIsLoading(false);
        })
        .catch((error) => {
          console.error('Location error:', error);
          setLocationError('위치 정보를 가져올 수 없습니다. 브라우저에서 위치 접근을 허용해주세요.');
          setIsLoading(false);
        });
    }
  }, [title, content]);

  // 글 저장
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    const newPost = {
      id: Date.now(),
      title: title.trim(),
      content: content.trim(),
      location: location,
      timestamp: new Date().toLocaleString('ko-KR'),
    };

    setPosts([newPost, ...posts]);
    setTitle('');
    setContent('');
    setLocation(null);
    setLocationError('');
  };

  // 글 삭제
  const deletePost = (id) => {
    setPosts(posts.filter(post => post.id !== id));
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1 className={styles.title}>📍 위치 기록 블로그</h1>
        <p className={styles.subtitle}>글을 작성하면 자동으로 현재 위치가 기록됩니다</p>

        {/* 글 작성 폼 */}
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="text"
            placeholder="글 제목을 입력하세요"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={styles.input}
          />
          
          <textarea
            placeholder="글 내용을 입력하세요"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={styles.textarea}
            rows={4}
          />

          {/* 위치 정보 표시 */}
          {(title || content) && (
            <div className={styles.locationInfo}>
              {isLoading && (
                <div className={styles.loading}>📍 위치 정보를 가져오는 중...</div>
              )}
              
              {locationError && (
                <div className={styles.error}>⚠️ {locationError}</div>
              )}
              
              {location && !isLoading && (
                <div className={styles.location}>
                  📍 현재 위치: {location.address}
                  <br />
                  <small>
                    위도: {location.latitude.toFixed(6)}, 
                    경도: {location.longitude.toFixed(6)}
                  </small>
                </div>
              )}
            </div>
          )}

          <button type="submit" className={styles.submitButton}>
            글 작성하기
          </button>
        </form>

        {/* 작성된 글 목록 */}
        <div className={styles.posts}>
          <h2>작성된 글 ({posts.length}개)</h2>
          {posts.length === 0 ? (
            <p className={styles.noPosts}>아직 작성된 글이 없습니다.</p>
          ) : (
            posts.map(post => (
              <div key={post.id} className={styles.post}>
                <div className={styles.postHeader}>
                  <h3>{post.title}</h3>
                  <button 
                    onClick={() => deletePost(post.id)}
                    className={styles.deleteButton}
                  >
                    삭제
                  </button>
                </div>
                
                <p className={styles.postContent}>{post.content}</p>
                
                <div className={styles.postMeta}>
                  <div className={styles.timestamp}>📅 {post.timestamp}</div>
                  {post.location && (
                    <div className={styles.postLocation}>
                      📍 {post.location.address}
                      <br />
                      <small>
                        위도: {post.location.latitude.toFixed(6)}, 
                        경도: {post.location.longitude.toFixed(6)}
                      </small>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
