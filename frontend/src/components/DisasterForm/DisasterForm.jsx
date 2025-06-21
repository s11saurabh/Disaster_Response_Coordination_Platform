import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { 
  AlertTriangle, 
  MapPin, 
  Save, 
  X, 
  Upload, 
  Loader2,
  Tag,
  FileText,
  Eye,
  EyeOff
} from 'lucide-react';
import { useApi } from '../../hooks/useApi';

const DisasterForm = ({ onDisasterCreated, user }) => {
  const navigate = useNavigate();
  const { disasters, geocoding } = useApi();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [extractedLocation, setExtractedLocation] = useState(null);
  const [uploadedImages, setUploadedImages] = useState([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      title: '',
      location_name: '',
      description: '',
      tags: [],
      priority: 'medium'
    }
  });

  const watchedValues = watch();

  const disasterTypes = [
    'earthquake', 'flood', 'fire', 'hurricane', 'tornado', 'tsunami',
    'volcano', 'landslide', 'drought', 'blizzard', 'explosion', 'chemical_spill'
  ];

  const priorityLevels = [
    { value: 'low', label: 'Low Priority', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: 'Medium Priority', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'High Priority', color: 'bg-orange-100 text-orange-800' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' },
    { value: 'critical', label: 'Critical', color: 'bg-red-200 text-red-900' }
  ];

  const handleExtractLocation = async () => {
    if (!watchedValues.description) {
      toast.error('Please enter a description first');
      return;
    }

    setIsGeocoding(true);
    try {
      const response = await geocoding.geocode({
        description: watchedValues.description
      });

      if (response.success && response.data.location_name) {
        setExtractedLocation(response.data);
        setValue('location_name', response.data.location_name);
        toast.success('Location extracted successfully!');
      } else {
        toast.error('Could not extract location from description');
      }
    } catch (error) {
      toast.error('Failed to extract location');
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleTagToggle = (tag) => {
    const currentTags = watchedValues.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    setValue('tags', newTags);
  };

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      const newImages = imageFiles.map(file => ({
        id: Date.now() + Math.random(),
        file,
        preview: URL.createObjectURL(file),
        name: file.name
      }));
      setUploadedImages(prev => [...prev, ...newImages]);
    }
  };

  const removeImage = (imageId) => {
    setUploadedImages(prev => {
      const image = prev.find(img => img.id === imageId);
      if (image) {
        URL.revokeObjectURL(image.preview);
      }
      return prev.filter(img => img.id !== imageId);
    });
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    
    try {
      // Add priority to tags if not already included
      const finalTags = [...(data.tags || [])];
      if (data.priority && !finalTags.includes(data.priority)) {
        finalTags.push(data.priority);
      }

      const disasterData = {
        ...data,
        tags: finalTags,
        owner_id: user?.id || 'netrunnerX'
      };

      const response = await disasters.create(disasterData);
      
      if (response.success) {
        toast.success('Disaster reported successfully!');
        onDisasterCreated?.(response.data);
        navigate('/disasters');
      } else {
        toast.error(response.error?.message || 'Failed to create disaster report');
      }
    } catch (error) {
      toast.error('Failed to submit disaster report');
      console.error('Error creating disaster:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Report New Disaster</h1>
                <p className="text-sm text-gray-600">Provide detailed information about the emergency situation</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span>{showPreview ? 'Hide Preview' : 'Show Preview'}</span>
              </button>
              
              <button
                type="button"
                onClick={() => navigate('/disasters')}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Main Form */}
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Disaster Title *
                  </label>
                  <input
                    type="text"
                    {...register('title', { 
                      required: 'Title is required',
                      minLength: { value: 3, message: 'Title must be at least 3 characters' }
                    })}
                    className={`input-field ${errors.title ? 'input-field-error' : ''}`}
                    placeholder="Brief description of the disaster"
                  />
                  {errors.title && (
                    <p className="form-error">{errors.title.message}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Detailed Description *
                  </label>
                  <textarea
                    rows={4}
                    {...register('description', { 
                      required: 'Description is required',
                      minLength: { value: 10, message: 'Description must be at least 10 characters' }
                    })}
                    className={`input-field resize-none ${errors.description ? 'input-field-error' : ''}`}
                    placeholder="Provide detailed information about the situation, affected areas, and immediate needs..."
                  />
                  {errors.description && (
                    <p className="form-error">{errors.description.message}</p>
                  )}
                  <p className="form-help">
                    Include specific details about the disaster, affected areas, and immediate needs
                  </p>
                </div>

                {/* Location */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Location
                    </label>
                    <button
                      type="button"
                      onClick={handleExtractLocation}
                      disabled={isGeocoding || !watchedValues.description}
                      className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-700 disabled:text-gray-400"
                    >
                      {isGeocoding ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <MapPin className="w-4 h-4" />
                      )}
                      <span>Extract from description</span>
                    </button>
                  </div>
                  
                  <input
                    type="text"
                    {...register('location_name')}
                    className="input-field"
                    placeholder="City, neighborhood, or specific location"
                  />
                  
                  {extractedLocation && (
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">
                        ✅ Location extracted: {extractedLocation.location_name}
                      </p>
                    </div>
                  )}
                  
                  <p className="form-help">
                    Specify the affected location. You can also extract it automatically from the description.
                  </p>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Priority Level *
                  </label>
                  <div className="space-y-2">
                    {priorityLevels.map((priority) => (
                      <label key={priority.value} className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          {...register('priority', { required: 'Priority is required' })}
                          value={priority.value}
                          className="sr-only"
                        />
                        <div className={`flex items-center space-x-3 w-full p-3 rounded-lg border-2 transition-all ${
                          watchedValues.priority === priority.value
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}>
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            watchedValues.priority === priority.value
                              ? 'border-red-500 bg-red-500'
                              : 'border-gray-300'
                          }`}>
                            {watchedValues.priority === priority.value && (
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${priority.color}`}>
                            {priority.label}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                  {errors.priority && (
                    <p className="form-error">{errors.priority.message}</p>
                  )}
                </div>
              </div>

              {/* Side Panel */}
              <div className="space-y-6">
                {/* Disaster Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    <Tag className="w-4 h-4 inline mr-1" />
                    Disaster Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {disasterTypes.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleTagToggle(type)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg border transition-all ${
                          (watchedValues.tags || []).includes(type)
                            ? 'bg-red-100 border-red-500 text-red-700'
                            : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  <p className="form-help mt-2">
                    Select all applicable disaster types
                  </p>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    <Upload className="w-4 h-4 inline mr-1" />
                    Upload Images
                  </label>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Click to upload images</p>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</p>
                    </label>
                  </div>

                  {/* Uploaded Images Preview */}
                  {uploadedImages.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {uploadedImages.map((image) => (
                        <div key={image.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                          <img
                            src={image.preview}
                            alt={image.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{image.name}</p>
                            <p className="text-xs text-gray-500">{(image.file.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeImage(image.id)}
                            className="p-1 text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Preview Panel */}
                {showPreview && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                  >
                    <h3 className="font-medium text-gray-900 mb-3">Report Preview</h3>
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="font-medium">Title:</span>
                        <p className="text-gray-700">{watchedValues.title || 'No title provided'}</p>
                      </div>
                      
                      <div>
                        <span className="font-medium">Location:</span>
                        <p className="text-gray-700">{watchedValues.location_name || 'No location provided'}</p>
                      </div>
                      
                      <div>
                        <span className="font-medium">Priority:</span>
                        <span className={`ml-2 px-2 py-1 rounded text-xs ${
                          priorityLevels.find(p => p.value === watchedValues.priority)?.color || 'bg-gray-100 text-gray-800'
                        }`}>
                          {priorityLevels.find(p => p.value === watchedValues.priority)?.label || 'Not selected'}
                        </span>
                      </div>
                      
                      {(watchedValues.tags || []).length > 0 && (
                        <div>
                          <span className="font-medium">Types:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(watchedValues.tags || []).map((tag) => (
                              <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <span className="font-medium">Description:</span>
                        <p className="text-gray-700 mt-1">{watchedValues.description || 'No description provided'}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <div className="flex items-center space-x-4">
                <div className={`flex items-center space-x-2 text-sm ${
                  isValid ? 'text-green-600' : 'text-gray-500'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${isValid ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span>{isValid ? 'Form is complete' : 'Please complete required fields'}</span>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => navigate('/disasters')}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  disabled={isSubmitting || !isValid}
                  className="flex items-center space-x-2 px-6 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 disabled:transform-none"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Submit Report</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </motion.div>

      {/* Help Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6"
      >
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Reporting Guidelines</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <h4 className="font-medium mb-2">What to Include:</h4>
            <ul className="space-y-1 list-disc list-inside">
              <li>Specific location details</li>
              <li>Number of people affected</li>
              <li>Immediate needs and resources required</li>
              <li>Current situation status</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Priority Guidelines:</h4>
            <ul className="space-y-1 list-disc list-inside">
              <li><strong>Critical:</strong> Life-threatening emergencies</li>
              <li><strong>Urgent:</strong> Immediate response needed</li>
              <li><strong>High:</strong> Significant impact expected</li>
              <li><strong>Medium:</strong> Standard response time</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DisasterForm;