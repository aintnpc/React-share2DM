import React from 'react';

interface TermsTemplateProps {
  title: string;
  content: string;
  lastUpdated: string;
}

export default function TermsTemplate({ title, content, lastUpdated }: TermsTemplateProps) {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px' }}>
      <h1>{title}</h1>
      <p style={{ color: '#666', fontSize: 14 }}>최종 수정일: {lastUpdated}</p>
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  );
}
