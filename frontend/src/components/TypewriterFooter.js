"use client";
import { useState, useEffect, useRef } from "react";

export default function TypewriterFooter() {
  const [text, setText] = useState("");
  const fullText = "Virlo API might fail due to insufficient credit balance, but Connection Exists!!";
  const [isTyping, setIsTyping] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsTyping(true);
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isTyping) return;

    let index = 0;
    const interval = setInterval(() => {
      setText(fullText.slice(0, index));
      index++;
      if (index > fullText.length) {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isTyping]);

  return (
    <div ref={containerRef} className="footer-typewriter-container">
      <div className="typewriter-text">
        {text}
        <span className="cursor">|</span>
      </div>
    </div>
  );
}
