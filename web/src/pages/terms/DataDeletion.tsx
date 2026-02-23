import React from 'react';
import TermsTemplate from './TermsTemplate';

const content = `
<h2>Data Deletion Request</h2>
<p>
  If you wish to delete your data associated with Share2DM, please send an email to
  <a href="mailto:support@clozet.my">support@clozet.my</a> with the subject line
  <strong>"Data Deletion Request"</strong>.
</p>
<p>Please include the following information in your email:</p>
<ul>
  <li>Your Instagram username</li>
  <li>The email address associated with your account</li>
</ul>
<p>
  Upon receiving your request, we will delete all data associated with your account
  within <strong>30 days</strong>. You will receive a confirmation email once the deletion is complete.
</p>

<h2>What data will be deleted</h2>
<ul>
  <li>Your account information (Instagram account ID, page information)</li>
  <li>Campaign data and message history</li>
  <li>Analytics and engagement data</li>
  <li>Any other data stored in connection with your use of Share2DM</li>
</ul>

<h2>Contact</h2>
<p>
  If you have any questions about data deletion, please contact us at
  <a href="mailto:support@clozet.my">support@clozet.my</a>.
</p>
`;

export default function DataDeletion() {
  return <TermsTemplate title="Data Deletion" content={content} lastUpdated="2026-02-17" />;
}
